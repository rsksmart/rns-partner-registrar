# Solidity API

## PartnerManager

### Partner

```solidity
struct Partner {
  bool isPartner;
  contract IPartnerConfiguration configuration;
}
```

### constructor

```solidity
constructor(contract IAccessControl accessControl) public
```

### isPartner

```solidity
function isPartner(address partner) external view returns (bool)
```

returns true if the partner is whitelisted

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address for the partner |

### addPartner

```solidity
function addPartner(address partner, contract IPartnerConfiguration partnerConfiguration) external
```

adds a partner to the whitelist and sets its configuration

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address for the partner that will be whitelisted |
| partnerConfiguration | contract IPartnerConfiguration | address of the contract that implements the partner configuration interface |

### removePartner

```solidity
function removePartner(address partner) external
```

removes a partner from the whitelist

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address for the partner that will be removed from the whitelist |

### setPartnerConfiguration

```solidity
function setPartnerConfiguration(address partner, contract IPartnerConfiguration partnerConfiguration) external
```

sets the configuration for a partner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address for the partner |
| partnerConfiguration | contract IPartnerConfiguration |  |

### getPartnerConfiguration

```solidity
function getPartnerConfiguration(address partner) public view returns (contract IPartnerConfiguration)
```

returns the configuration for a partner

#### Parameters

| Name | Type | Description |
| ---- | ---- | ----------- |
| partner | address | address for the partner |

