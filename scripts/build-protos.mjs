#!/usr/bin/env zx

const destFolder = path.join(__dirname, '../src/protobuf')

await $`protoc --ts_out ${destFolder} --proto_path protos protos/api.proto`
