---
title: Introducing DigiSurf
subtitle: 
date: 2025-03-17
tags:
  - blog/post
source: https://seanmcloughl.in/introducing-digisurf
---
I haven't written much in the past month. That's mostly due to me using my daily writing time as daily coding time for a terminal user-interface app I'm releasing in alpha today: [DigiSurf](https://github.com/SeanMcLoughlin/digisurf) . For the past month, I've been using Claude to write much of this code base. 

## Why?

I work in the semiconductor industry in an HPC environment which requires me to SSH into a more powerful computer. I sometimes need to launch GUIs on the machine I've SSH'd into, which requires me to use a VNC viewer. VNCs are inherently slow, so I want to avoid them as much as I possibly can by doing most of my work in a terminal. This is what made me interested in terminal user-interfaces, or TUIs. They may not have all of the bells and whistles of a full-blown GUI, but if a TUI can do 95% of what a GUI can, then using a TUI can save me many headaches over a long period of time. 

One of the common GUIs I need to use is [Synopsys' Verdi waveform viewer](https://www.synopsys.com/verification/debug/verdi.html) (props to Synopsys' marketing team for providing zero screenshots of what this tool looks like). It has way more features than I need if I want to quickly view a few signals in a waveform. So if I'm trying to debug a few signals quickly, doing this via a TUI would be far more useful.

## Coding with Claude 

I've had the idea for a waveform viewer TUI in the back of my mind for many years now – well before the advent of AI copilot coding. Since Claude has gotten so good at generating code, and libraries like [ratatui](https://ratatui.rs/) have matured over the past few years, I thought I'd give it a shot and see what I could make. If it worked out, I'd have a new tool I could use during my day job. If not, I spent only a few dollars in credits.

It started with [vibe coding](https://x.com/karpathy/status/1886192184808149383), a term that is firmly embedded into the zeitgeist at this point. Claude was able to make a really good, basic prototype over the course of a few hours. The entire code base was <20k tokens, so I wasn't rate-limited by Anthropic. It felt like I was coding at the speed of thought and nothing was slowing me down. I was in a state of flow akin to how I've felt playing Factorio. 

Slowly but surely, things started to get more complicated. System complexity rose. The code base grew beyond 20k tokens so I couldn't upload the whole code base immediately into a new chat with Claude every time I had a new feature or bug I wanted it to fix. I began to think of more and more features that I wanted to add. While my pace of development did slow down due to all of this, it still far outpaced what it'd be if I was writing the code myself. 

I learned how to more effectively use Claude by compartmentalizing my code into small pieces that could fit into a single API request. This was beneficial not just for using Claude, but also for separation of responsibilities, as well as the readability of the code. With Claude 3.7, I could ask Claude to write a bunch of unit tests for a large file, get up to start making some tea, and come back to finished code that I got to review. I had to train myself to be meticulous with reviewing Claude's edits, as Claude sometimes tried to cheat unit tests by hard-coding answers into the source code. 

Paired with [Zed's $10/mo of credits for Claude](https://zed.dev/blog/zed-ai-billing), as well as my own Anthropic API key, I've only spent ~$10 in API credits out of pocket to get to the point of releasing DigiSurf in alpha. This is also with very liberal usage of Claude – I'm sure there are ways I could have minimized my usage to get the same result in the same amount of time. I think that this was $10 well-spent, even just for the learning opportunity of building an app from scratch with an AI copilot. 

## What's next

I've still got tons of features I want to add to DigiSurf, and I'm sure there are bugs that I've missed. I hope to get to a 1.0 full release sometime in the near future. I'm going to keep adding the features I've got in mind today, hopefully avoiding the dreaded "feature creep," fixing bugs along the way, and try to use DigiSurf in an FPGA project on the side to see if there's anything more I'd like to add.

Please give DigiSurf a try and let me know what you think. 