---
title: The QTRVSIM simulator
draft: false
tags:
---

# The [QTRVSIM](https://comparch.edu.cvut.cz/qtrvsim/app/) simulator

When you open the QTSim simulator the following window will appear:

![[QTSIM_config.png]]

Here, you should select the `No pipeline no cache` preset, as the processor we studied today is the simplest processor you can implement. Don't worry, when we complete the units `Microprocessors and codesign reinforcement` and `RISC-V based system architecture` you will be familiar with every preset presented. For now, let's select the simpler configuration to learn how assembly works. Click on the `start empty` button.

![[Processor_layout.png]]

Now you are presented with all the building blocks of our processor. From program memory (where we store the instructions), the PC (Wich points to the currently-executing instruction), the registers (Where we store the data that we are operating on), the ALU (Where arithmetic and logic operations are performed) and the data memory (Where data is stored).

This simulator is able to execute all RISCV32IM code, as it implements the Integer and Multiplication extensions.

A window with the status of the register file can be opened clicking -> `Windows\Registers`
![[Registers.png]]

A window with the program code can be open by clicking -> `Windows\Program` resulting in the window below opening. The currently executing instruction is highlighted.

![[20240930133908.png]]

However, using this window to debug the assembler code can prove hard, as some instructions are translated into pseudoinstructions, breaking your code structuring. To ease debugging we can break up or code into sections with labels such as the above code, where the code is broken down into two labeled sections: `start`and `final`

To go into the assembler code corresponding to the *final* section we use the `Machine\Show Symbol` feature. Selecting the `final` symbol and clicking `show program`

![[20240930134351.png]]

Furthermore, one can set [breakpoints](https://en.wikipedia.org/wiki/Breakpoint) in their assembler program by clicking in the Bp field, as shown below. If the program is ran with the `Machine\Run` command and encounters an instruction with a breakpoint, it's execution will pause. Breakpoints are useful to examine the program behavior in certain sections of code where the programmer suspects a bug is pressent.

![[20240930145136.png]]

