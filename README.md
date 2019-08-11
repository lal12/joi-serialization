# JOI Serialization

This lib can serialize and deserialize a JOI Schema into an arbitrary object, which could be saved as JSON e.g. in a Database.

Typescript definitions are included.

It supports all functions documented in the JOI API reference, also nothing is lost during the serialization, with some exceptions:

- Currently there is no way to serialize JOI extensions.
- JOI references are not implemented currently


You have to install `joi` as a peer dependency. This library was tested with `joi` version `14.3.1`, but probably works with other versions too.

## Serialization

For serialization the function `serialize` is exported. Just call it with a JOI Schema as parameter.

It is just a wrapper to the JOI function `schema.describe()`, so for serialization purposes, you don't have to install this library. However this might change in the future.

## Deserialization

For deserialization the function `deserialize(schema, options?)` is exported. Just pass the serialized JOI Schema (a JOI Schema description) as parameter. Optionally you can pass an option object:
- `symbols`: `{[name: string]: symbol}`, will be used for deserialization of `joi.symbol().map()`. Since javascript symbols cannot be serialized to e.g. JSON, you can pass a symbol map, which will be used.  

## Installation

`npm install joi-serialization`

## Usage

`const {serialize, deserialize} = require('joi-serialization').`

## Tests

This library is heavily tested and should (while not measured) come near to 100% coverage.

## Implemented JOI Types

- String
- Bool
- Binary
- Date
- Func
- Any
- Meta (things like `.tags`, `.description`... from any type)
- Number
- Symbol
- Alternatives
- Object
