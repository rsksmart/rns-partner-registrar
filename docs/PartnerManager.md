# PartnerManager

*Identity Team @IOVLabs*

> Keeps track of the whitelisted partners and its configurations.





## Methods

### addPartner

```solidity
function addPartner(address partner, address partnerOwnerAccount) external nonpayable
```

adds a partner to the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address for the partner that will be whitelisted |
| partnerOwnerAccount | address | address of the owner account for the partner that will be able to withdraw the collected funds |

### getPartnerConfiguration

```solidity
function getPartnerConfiguration(address partner) external view returns (contract IPartnerConfiguration)
```

returns the configuration for a partner



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address for the partner |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | contract IPartnerConfiguration | undefined |

### getPartnerOwnerAccount

```solidity
function getPartnerOwnerAccount(address partner) external view returns (address)
```

returns the owner account of a partner



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address for the partner |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### isPartner

```solidity
function isPartner(address partner) external view returns (bool)
```

returns true if the partner is whitelisted



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address for the partner |

#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | bool | undefined |

### owner

```solidity
function owner() external view returns (address)
```



*Returns the address of the current owner.*


#### Returns

| Name | Type | Description |
|---|---|---|
| _0 | address | undefined |

### removePartner

```solidity
function removePartner(address partner) external nonpayable
```

removes a partner from the whitelist



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address for the partner that will be removed from the whitelist |

### renounceOwnership

```solidity
function renounceOwnership() external nonpayable
```



*Leaves the contract without owner. It will not be possible to call `onlyOwner` functions anymore. Can only be called by the current owner. NOTE: Renouncing ownership will leave the contract without an owner, thereby removing any functionality that is only available to the owner.*


### setPartnerConfiguration

```solidity
function setPartnerConfiguration(address partner, contract IPartnerConfiguration partnerConfiguration) external nonpayable
```

sets the configuration for a partner



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner | address | address for the partner |
| partnerConfiguration | contract IPartnerConfiguration | undefined |

### transferOwnership

```solidity
function transferOwnership(address newOwner) external nonpayable
```



*Transfers ownership of the contract to a new account (`newOwner`). Can only be called by the current owner.*

#### Parameters

| Name | Type | Description |
|---|---|---|
| newOwner | address | undefined |



## Events

### OwnershipTransferred

```solidity
event OwnershipTransferred(address indexed previousOwner, address indexed newOwner)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| previousOwner `indexed` | address | undefined |
| newOwner `indexed` | address | undefined |

### PartnerAdded

```solidity
event PartnerAdded(address indexed partner, address indexed ownerAccount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| partner `indexed` | address | undefined |
| ownerAccount `indexed` | address | undefined |

### PartnerConfigurationChanged

```solidity
event PartnerConfigurationChanged(address partner, address configurationContract)
```

event emitted when the configuration for a partner is set



#### Parameters

| Name | Type | Description |
|---|---|---|
| partner  | address | undefined |
| configurationContract  | address | undefined |

### PartnerRemoved

```solidity
event PartnerRemoved(address indexed partner, address indexed ownerAccount)
```





#### Parameters

| Name | Type | Description |
|---|---|---|
| partner `indexed` | address | undefined |
| ownerAccount `indexed` | address | undefined |



