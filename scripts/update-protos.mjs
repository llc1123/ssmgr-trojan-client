#!/usr/bin/env zx

const file = await fetch('https://github.com/p4gefau1t/trojan-go/raw/master/api/service/api.proto')
const text = await file.text()
const protobufFolder = path.join(__dirname, '../protos')
const filePath = path.join(protobufFolder, 'api.proto')

await fs.writeFile(filePath, text)

