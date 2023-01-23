# FeeManager

*Identity Team @IOVLabs*

> Keeps track of the balances of the collected revenue made by the partners.





## Methods

### deposit

```solidity
function deposit(address partner, uint256 amount) external nonpayable
```

allows the registrar and renewer to deposit the partners revenue share



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address of the partners that triggered the deposit |
| amount | uint256 | amount of tokens from the sale |

### getBalance

```solidity
function getBalance(address partner) external view returns (uint256)
```

allows checking the revenue balance of any partner



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address of the partner |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | uint256 | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |

### withdraw

```solidity
function withdraw() external nonpayable
```

allows the partner to withdraw the balance of their revenue






## Events

### DepositSuccessful

```solidity
event DepositSuccessful(uint256 amount, address from)
```

event emitted on successful deposit



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |
| from  | address | undefined |

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### WithdrawalSuccessful

```solidity
event WithdrawalSuccessful(uint256 amount, address to)
```

event emitted on successful withdrawal



#### Parameters

| Name | Type | Description |
|---|---|---|
| amount  | uint256 | undefined |
| to  | address | undefined |



## Errors

### NotAuthorized

```solidity
error NotAuthorized(address sender)
```

thrown when an account tries to perform an action that is not authorised



#### Parameters

| Name | Type | Description |
|---|---|---|
| sender | address | undefined |

### TransferFailed

```solidity
error TransferFailed(address from, address to, uint256 amount)
```

thrown when the transfer of tokens fails



#### Parameters

| Name | Type | Description |
|---|---|---|
| from | address | address of the sender |
| to | address | address of the receiver |
| amount | uint256 | amount of tokens |

### ZeroBalance

```solidity
error ZeroBalance()
```

thrown when an account tries to withdraw with a zero balance





