it("Test Case No. 1 - The 'IsOwnerRole function should throw FALSE", async () => {
  //Test Case No. 1
  //User Role (LogIn):    Regular User
  //Function To Execute:  is Owner Role
}); //it

it("Test Case No. 2 - The 'IsOwnerRole function should throw TRUE", async () => {
  //Test Case No. 2
  //User Role (LogIn):    RNS Owner
  //Function To Execute:  is Owner Role
}); //it

it("Test Case No. 3 - The 'IsOwnerRole function should throw FALSE", async () => {
  //Test Case No. 3
  //User Role (LogIn):    Partner Reseller
  //Function To Execute:  is Owner Role
}); //it

it("Test Case No. 4 - The 'IsOwnerRole function should throw FALSE", async () => {
  //Test Case No. 4
  //User Role (LogIn):    High Level Operator
  //Function To Execute:  is Owner Role
}); //it

it("Test Case No. 5 - The 'IsHLO function should throw FALSE", async () => {
  //Test Case No. 5
  //User Role (LogIn):    Regular User
  //Function To Execute:  is High Level Operator
}); //it

it("Test Case No. 6 - The 'IsHLO function should throw FALSE", async () => {
  //Test Case No. 6
  //User Role (LogIn):    RNS Owner
  //Function To Execute:  is High Level Operator
}); //it

it("Test Case No. 7 - The 'IsHLO function should throw FALSE", async () => {
  //Test Case No. 7
  //User Role (LogIn):    Partner Reseller
  //Function To Execute:  is High Level Operator
}); //it

it("Test Case No. 8 - The 'IsHLO function should throw TRUE", async () => {
  //Test Case No. 8
  //User Role (LogIn):    High Level Operator
  //Function To Execute:  is High Level Operator
}); //it

it("Test Case No. 9 - The 'Add High Level Operator' function should throw an error message", async () => {
  //Test Case No. 9
  //User Role (LogIn):    Regular User (-)
  //Function To Execute:  Add High Level Operator
}); //it

it("Test Case No. 10 - The 'Add High Level Operator' function should work succesfully", async () => {
  //Test Case No. 10
  //User Role (LogIn):    RNS Owner
  //Function To Execute:  Add High Level Operator
}); //it

it("Test Case No. 11 - The 'Add High Level Operator' function should throw an error message", async () => {
  //Test Case No. 11
  //User Role (LogIn):    Partner Reseller (-)
  //Function To Execute:  Add High Level Operator
}); //it

it("Test Case No. 12 - The 'Add High Level Operator' function should throw an error message", async () => {
  //Test Case No. 12
  //User Role (LogIn):    High Level Operator (-)
  //Function To Execute:  Add High Level Operator
}); //it

it("Test Case No. 13 - The 'Remove High Level Operator' function should throw an error message", async () => {
  //Test Case No. 13
  //User Role (LogIn):    Regular User (-)
  //Function To Execute:  Remove High Level Operator
}); //it

it("Test Case No. 14 - The 'Remove High Level Operator' function should work succesfully", async () => {
  //Test Case No. 14
  //User Role (LogIn):    RNS Owner
  //Function To Execute:  Remove High Level Operator
}); //it

it("Test Case No. 15 - The 'Remove High Level Operator' function should throw an error message", async () => {
  //Test Case No. 15
  //User Role (LogIn):    Partner Reseller (-)
  //Function To Execute:  Remove High Level Operator
}); //it

it("Test Case No. 16 - The 'Remove High Level Operator' function should throw an error message", async () => {
  //Test Case No. 16
  //User Role (LogIn):    High Level Operator (-)
  //Function To Execute:  Remove High Level Operator
}); //it

it("Test Case No. 17 - The 'Transfer Ownership' function should throw an error message", async () => {
  //Test Case No. 17
  //User Role (LogIn):    Regular User (-)
  //Function To Execute:  Transfer Ownership
}); //it

it("Test Case No. 18 - The 'Transfer Ownership' function should work succesfully", async () => {
  //Test Case No. 18
  //User Role (LogIn):    RNS Owner
  //Function To Execute:  Transfer Ownership
}); //it

it("Test Case No. 19 - The 'Transfer Ownership' function should throw an error message", async () => {
  //Test Case No. 19
  //User Role (LogIn):    Partner Reseller (-)
  //Function To Execute:  Transfer Ownership
}); //it

it("Test Case No. 20 - The 'Transfer Ownership' function should throw an error message", async () => {
  //Test Case No. 20
  //User Role (LogIn):    High Level Operator (-)
  //Function To Execute:  Transfer Ownership
}); //it

it("Test Case No. 21 - The 'Set Maximum Duration' function should throw an error message; the parameter was NOT altered", async () => {
  //Test Case No. 21
  //User Role (LogIn):    Regular User (-)
  //Function To Execute:  Set Maximum Duration
}); //it

it("Test Case No. 22 - The 'Set Minimum Duration' function should throw an error message; the parameter was NOT altered", async () => {
  //Test Case No. 22
  //User Role (LogIn):    Partner Reseller (-)
  //Function To Execute:  Set Minimum Duration
}); //it

it("Test Case No. 23 - The 'Set Maximum Domain Length' function should throw an error message; the parameter was NOT altered", async () => {
  //Test Case No. 23
  //User Role (LogIn):    Regular User (-)
  //Function To Execute:  Set Maximum Domain Length
}); //it

it("Test Case No. 24 - The 'Set Minimum Domain Length' function should throw an error message; the parameter was NOT altered", async () => {
  //Test Case No. 24
  //User Role (LogIn):    Partner Reseller (-)
  //Function To Execute:  Set Minimum Domain Length
}); //it

it("Test Case No. 25 - The 'Set Fee Comission Percentage' function should throw an error message; the parameter was NOT altered", async () => {
  //Test Case No. 25
  //User Role (LogIn):    Regular User (-)
  //Function To Execute:  Set Fee Comission Percentage
}); //it

it("Test Case No. 26 - The 'Set Discount Percentage' function should throw an error message; the parameter was NOT altered", async () => {
  //Test Case No. 26
  //User Role (LogIn):    Partner Reseller (-)
  //Function To Execute:  Set Discount Percentage
}); //it
