<p align="middle">
    <img src="https://www.rifos.org/assets/img/logo.svg" alt="logo" height="100" >
</p>
<h3 align="middle">RNS Partner Registrar</h3>
<p align="middle">
    RNS Custom Registrar for IOV Partners
</p>

## Overview
```mermaid
sequenceDiagram
    actor User
    participant PartnerProxyContract
    participant PartnerRegistrar
    participant Controller
    participant RNS

    
    PartnerRegistrar->>PartnerRegistrar: whitelist(PartnerProxyContract)
    
    User->>PartnerProxyContract: commit(commitment)
    
    User->>PartnerProxyContract: canReveal(commitment)
    
    User->>PartnerProxyContract: register(name, nameOwner, secret, duration)
    
    PartnerProxyContract->>PartnerRegistrar: register(name, nameOwner, secret, duration)
    
    PartnerRegistrar->>PartnerRegistrar: validateName()
    
    PartnerRegistrar->>PartnerRegistrar: validatePrice()
    
    PartnerRegistrar->>Controller: register(label, nameOwner, duration)
    
    PartnerRegistrar--)Analytics Server: registerEvent(name, owner, etc)
    
    Controller->>Controller: _mint()
    
    Controller->>RNS: setSubnodeOwner(rootNode, label, tokenOwner)
    
    RNS->>Controller: ...
    
    Controller->>PartnerRegistrar: ...
    
    PartnerRegistrar->>PartnerProxyContract: ...
    
    PartnerProxyContract->>User: Name Registered

```

## Contracts
The Partner Registrar has five(5) main components
- Registrar
- FeeManager
- PartnerConfiguration
- PartnerManger
- PartnerProxy Factory