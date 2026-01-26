---
title: Full RV32I architecture
draft: false
tags:
---

prev > [[Simple RV32I monocycle processor]]

In this practice session we will implement the RV32I core that we have seen in the theory session. The final schematic of such core is presented in the following image:
![[riscv_completo.png]]

# Functional units

We have the same functional units with some new datapath elements to implement the whole RV32I instruction set.

## ALU 
The ALU has now new operations to support the new instructions

| Operation            | Op   |
| -------------------- | ---- |
| AND                  | 0000 |
| OR                   | 0001 |
| ADD                  | 0010 |
| Substract            | 0110 |
| SetLessThan          | 0011 |
| ShiftLeft            | 0100 |
| LessThanUnsigned     | 0101 |
| XOR                  | 0111 |
| ShiftRightLogical    | 1000 |
| ShiftRightArithmetic | 1001 |

## Control unit

The Control unit will now differenciate among the whole instruction types by its Opcode

| Opcode  | Action | Format    | Notes                                           |
| ------- | ------ | --------- | ----------------------------------------------- |
| 0110011 |        | R-format  | *Funct3 and Funct7 codify action*               |
| 0000011 | Load   | I-format  | *Funct3 codifies type of load*                  |
| 0010011 | Arith  | I-format  | *Arithmetic operations with immediates*         |
| 1100111 | JALR   | I-format  | *PCabsolute, but immediates codify jump offset* |
| 0100011 |        | S-format  | *Funct3 codifies the length*                    |
| 1100011 |        | SB-format | *Relative branches*                             |
| 0110111 | LUI    | U-format  |                                                 |
| 0010111 | AUIPC  | U-format  |                                                 |
| 1101111 | JAL    | UJ-format | *20-bit immediate for offset*                   |

It also will add extra control signals to command the new hardware in the datapath

- branch_inv: Set to one when inversion in the zero bit is needed
- jal_jalr: indicates an inconditional jump
- lui: uses a 20 bit immediate to load upper bits of a register
- pctoalu: allows the ALU operate with the PC value
