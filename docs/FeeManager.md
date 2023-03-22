# Solidity API

## FeeManager

### _PERCENT100_WITH_PRECISION18

```solidity
uint256 _PERCENT100_WITH_PRECISION18
```

### onlyAuthorised

```solidity
modifier onlyAuthorised()
```

### constructor

```solidity
constructor(contract RIF rif, contract IBaseRegistrar registrar, contract IBaseRenewer renewer, contract IPartnerManager partnerManager, address pool) public
```

### withdraw

```solidity
function withdraw() external
```

allows the partner to withdraw the balance of their revenue

### deposit

```solidity
function deposit(address partner, uint256 amount) external
```

allows the registrar and renewer to deposit the partners revenue share

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address of the partners that triggered the deposit |
| amount | uint256 | amount of tokens from the sale |

### getBalance

```solidity
function getBalance(address partner) external view returns (uint256)
```

allows checking the revenue balance of any partner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address of the partner |

