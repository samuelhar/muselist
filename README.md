# muselist
This is the repository for the MuseList Web Application.


Database demo/prototype. Make sure to install mongo before running "npm install". Start up the database with the terminal command "mongod", then run the app with "node muselist.js".

Some useful shell commands for the database:

Open mongo shell (connects to db):
`mongo`

Open database connection:
`mongod`

Switch to a collection:
`use <collection>`

Get all data (and format it):
`<collection>.find().pretty()`

Insert something:
```
db.<collection>.insert([{
"<field1>" : "<value1>" , 
"<field2>" : "<value2>"
}])
```

Remove all docs from a collection:
`db.<collection>.remove({})`

Show all collections in use:
`show collections`

Quit shell:
`exit`
