#!/bin/bash
curl https://api.unifyllm.top/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer sk-jxWqDIctALd5Rds0scFNHoxIDZnU4A6egpUNzsT1I7pT2Ahc" \
  -d '{"model":"claude-fable-5","messages":[{"role":"user","content":"Say hello in one sentence."}]}'