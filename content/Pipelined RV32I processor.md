---
title: 5. Pipelined RV32I processor
draft: false
tags:
---

prev > [[Programming our processor]]

## Introduction: the 5 classic RISC-V stages
In the previous practices we implemented a single-cycle processor, where every instruction goes through all the hardware in one (long) clock cycle. The clock period is therefore limited by the slowest instruction (a `lw`). Pipelining splits the execution of each instruction into stages separated by registers, so that **five instructions are in flight at the same time**, each one in a different stage. Ideally, one instruction finishes every cycle (CPI = 1) with a much shorter clock period.

The 5 classic stages of the RISC-V pipeline (Patterson and Hennessy, "Computer Organization and Design, RISC-V edition", Chapter 4) are:

| Stage | Name | What it does |
|---|---|---|
| IF | Instruction Fetch | Reads the instruction from the ROM using the PC and computes PC+4. |
| ID | Instruction Decode | Decodes the instruction, generates the control signals, reads the register file and generates the immediate. |
| EX | Execute | The ALU computes the operation, the memory address or the branch condition/target. |
| MEM | Memory access | Reads (`lw`) or writes (`sw`) the data RAM / GPIO. |
| WB | Write Back | Writes the ALU result or the loaded data into the register file. |

Between each pair of stages there is a pipeline register (`IF/ID`, `ID/EX`, `EX/MEM`, `MEM/WB`) that stores the data and the control signals that the instruction still needs.

```
 cycle:      1    2    3    4    5    6    7


 add x1,..   IF   ID   EX   MEM  WB           <- writes x1 in WB (cycle 5)
 sub ..,x1   .    IF   ID   EX   MEM  WB      <- needs x1 in ID (cycle 3)
 or  x3,..   .    .    IF   ID   EX   MEM  WB
```

As the example shows, overlapping the execution of instructions creates **hazards**:
- **Data hazards:** an instruction needs a value that a previous instruction has not yet written into the register file.
  - *ALU-to-ALU* hazards can be solved with **forwarding** (bypassing the result from the EX/MEM or MEM/WB registers to the ALU inputs).
  - *Load-use* hazards cannot be fully solved by forwarding (the data is available at the end of MEM), so the pipeline must **stall** for one cycle.
- **Control hazards:** the processor does not know the next PC until a branch/jump is resolved, so the instructions fetched after it may be incorrect and must be **flushed**.

In this practice we will first observe how the hazards make a program fail, then avoid them by software (inserting `nop` instructions), and finally solve them in hardware step by step.

## Initial project
Download the Vivado project provided for this practice. Its top module `riscv_core.sv` already contains the 5-stage pipeline (pipeline registers, control signals traveling through the stages, ALU, register file, memories...) **but without any hazard handling**: no forwarded data, no stalls and no flushes. 
Open the top level module and identify:
- The five stages and the four pipeline registers.
- Where the register file is written (WB) and read (ID).
- In which stage the branch/jump decision is taken and how the PC is updated.

>[!question]- Which stage resolves the branch condition in this project? How many instructions have already been fetched when the decision is taken?
>> [!todo] The branch is resolved in MEM (the signal `branch_jalr_or_branch` is generated there). By then three more instructions (IF, ID and EX) have been fetched following the PC+4 path, so they must be flushed if the branch is taken.

>[!question]- In the unmodified pipeline, how many instructions must be placed between a producer and a consumer of a register so that the consumer reads the correct value? 
>> [!todo] The producer writes in WB (cycle 5) and a consumer reads in ID. As the register file does not forward internally, the consumer ID must happen after the producer WB, so 3 instructions (or `nop`) are required between them. If the register file `regs.sv` is modified as follows (the value being written is bypassed to the read ports), only **two** instructions are required:
>> ```verilog
>> assign rddata1 = ((rdaddr1==wraddr) && (wraddr))? wrdata : regs[rdaddr1];
>> assign rddata2 = ((rdaddr2==wraddr) && (wraddr))? wrdata : regs[rdaddr2];
>> ```
>> Modify these two lines in the register file to obtain the 2-instruction distance.

## The Fibonacci test program
The project already includes a Fibonacci program in the file `rom.txt`. It computes the Fibonacci sequence and stores every value in RAM. The expected sequence is `0, 1, 1, 2, 3, 5, 8, 13, 21, 34, 55, 89, 144, 233, 377, 610`.

### Exercise 1. Observing the hazards
1. Make sure that the `from` parameter of the top module points to the provided `rom.txt` file and run a simulation.
2. Observe the signals of the register file, the ALU and the PC. Compare the values obtained with the expected ones.
3. Identify, instruction by instruction, every pair of dependent instructions in the loop and classify it as a data hazard (ALU-to-ALU, load-use) or a control hazard.

>[!question] Does the program work? Which instructions read a stale value? Fill a table with the format `producer -> consumer, register, distance in instructions, hazard type`.

**Upload a capture of the waveform showing a wrong value to the poliformat task, called `Exercise1.png`.**

### Exercise 2. Software solution: inserting NOPs
The simplest way to avoid hazards is to let the programmer (or the compiler) separate dependent instructions. A `nop` is pseudo instruction for `addi x0, x0, 0` and it has no effect on the processor state.

Use an application (for example [Venus](https://venus.kvakil.me/)) to insert the necessary `nop` instructions to eliminate hazards, and generate a `rom_nops.txt` file with the machine code of your new code version. Remember:
- Between a producer and its consumer there must be enough instructions (see the question above).
- After a taken branch the three following instructions (IF, ID and EX) are still executed, insert `nop` instructions after branch or jump instructions.
- Whenever possible, reordering independent instructions is better than inserting `nop`.

Set the `from` parameter to your new file, simulate and check that the sequence in RAM is correct.

>[!question]- How many instructions are executed per Fibonacci iteration now? How many of them are useful? What is the penalty in performance?
>> [!todo] Compare the number of instructions of the loop with the original one and count the `nop`. All the `nop` are wasted cycles.

**Show this exercise to the professor for evaluation in class**

### Exercise 3. Data forwarding
Forwarding sends the result of an instruction directly from the pipeline registers to the ALU inputs, without waiting for the write back stage.

The data forwarding must be implemented in the top file `riscv_core.sv`, where the pipeline registers and the ALU are located. We have to compare the source registers of the instruction in EX (`rs1_ex`, `rs2_ex`) with the destination register of the instructions in the MEM and WB stages (`rd_mem`, `rd_wb`):

```c
if (RegWrite_mem && rd_mem != 0 && rd_mem == rs1_ex)
   forwardA = value from ALU_Result_MEM
else if (RegWrite_wb && rd_wb != 0 && rd_wb == rs1_ex)
   forwardA = value from mem_to_reg_wb MUX
else
   forwardA = value read from register_file

// same for forwardB with rs2_ex
```

Modify the multiplexer in each ALU input so that it selects between the register file value, the WB value and the ALU result of the MEM stage.

>[!question]- Why is the `rd != 0` condition needed? Why does the EX/MEM forwarding have priority over MEM/WB?
>> [!todo] Register x0 is always 0 and a write to it must never be forwarded. If both stages write the same register, the instruction in MEM is the most recent one, so its value is the correct one.

>[!question]- The value of the store (`sw rs2`) is not sent through the ALU. Does it need forwarding too? Where should the forwarded value be taken from?
>> [!todo] Yes. The forwarded `rs2` value must also be used as the data to write in memory, so the forwarding multiplexer for B must be placed before the point where the store data is sent to the EX/MEM register.

Once forwarding is implemented:
1. Run again your `nop` version to check that nothing broke.
2. Create a new version, `rom_fwd.txt`, removing all the `nop` instructions that are no longer needed. **Keep the ones needed for the load-use and control hazards.**
3. Simulate it and check the sequence.

**Show this exercise to the professor for evaluation in class**

### Exercise 4. Load-use hazards: stall
When the instruction right after a `lw` uses the loaded register, the data is not available until the end of MEM, so forwarding is not enough and the pipeline must insert a bubble.

1. Implement the **hazard detection unit**. If the instruction in EX is a load (`MemRead_ex`) and its `rd_ex` is equal to `rs1_id` or `rs2_id` of the instruction in ID, then `stall = 1`.
2. When `stall = 1`:
   - Keep the PC value (do not update it).
   - Keep the `IF/ID` register (do not update it).
   - Clear the control signals of the `ID/EX` register (insert a bubble: `RegWrite = 0`, `MemWrite = 0`, `MemRead = 0`, `Branch = 0`...).
3. After the stall, the loaded value is forwarded from the MEM/WB register by the forwarding logic of the previous exercise.

>[!question] Why is it enough to stall only one cycle? Why must the control signals of the bubble be set to 0?
> > [!todo] After one cycle the load is in MEM/WB and its data can be forwarded to the instruction in EX. If the bubble kept the control signals, the stalled instruction would be executed twice (e.g. a `sw` writing twice, or a register being written with a wrong value).

### Exercise 5. Control hazards: flush
In our pipeline, branches and jumps are resolved in MEM. Instructions fetched after them are in IF, ID and EX and must be discarded if the branch is taken (or the jump is executed).

1. The taken branch/jump signal is already generated in the project (`branch_jalr_or_branch`). Use it as the `flush` signal:
```verilog
    assign flush = branch_jalr_or_branch;
```
2. When `flush = 1`:
   - Load the PC with the branch/jump target.
   - Clear the `IF/ID` register (convert the instruction into a `nop`).
   - Clear the control signals of the `ID/EX` and `EX/MEM` registers (convert the instructions into bubbles).
3. Note that `flush` and `stall` can be active at the same time. Which one must have priority?

>[!question]- How many cycles are lost every time a branch is taken? What happens when it is not taken?
>> [!todo] Three cycles are lost on a taken branch (the three flushed instructions). When it is not taken no cycles are lost, as the pipeline implicitly predicts "not taken".

>[!question]- Why does `flush` have priority over `stall`?
>> [!todo] If the branch in MEM is taken, the instructions in ID and EX are going to be discarded anyway, so there is no point in stalling for them.

### Exercise 6. Final test
Finally, run the **original** `rom.txt` (the one **without** any `nop`) in your complete processor with forwarding, stalls and flushes.
1. Simulate it and check that the sequence `1, 1, 2, 3, 5, 8, 13, 21, 34, 55` is correct.
2. Count the cycles needed to complete the program and compare them with the ones of your `nop` and forwarding versions. Which version is the fastest and by how much?
3. Optionally, modify the assembly code to write the sequence to the 7-segment display (adding a delay loop between writes to be able to see the values), generate the bitstream, flash it into the FPGA and check the result on the board.

>[!question]- Where are the stalls and flushes happening in the final execution? Mark in the waveform the cycles in which `stall` and `flush` are active.
>> [!todo] One stall at the initial `lw` and three flushed instructions each time `bxx` is taken.

**Upload a capture of the waveform showing the correct result and the stall/flush signals, called `Exercise6.png`, to the poliformat task.**

**Show this exercise to the professor for evaluation in class**

**Congratulations!! You have implemented a pipelined RV32I processor that handles data and control hazards!!**

prev > [home](index)