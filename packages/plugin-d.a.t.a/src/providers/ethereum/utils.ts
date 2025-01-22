const ERC20_ABI = [
    {
        inputs: [
            {
                internalType: "string",
                name: "_name",
                type: "string",
            },
            {
                internalType: "string",
                name: "_symbol",
                type: "string",
            },
            {
                internalType: "uint8",
                name: "_decimals",
                type: "uint8",
            },
            {
                internalType: "uint256",
                name: "_initAmt",
                type: "uint256",
            },
        ],
        stateMutability: "nonpayable",
        type: "constructor",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "allowance",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "needed",
                type: "uint256",
            },
        ],
        name: "ERC20InsufficientAllowance",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "balance",
                type: "uint256",
            },
            {
                internalType: "uint256",
                name: "needed",
                type: "uint256",
            },
        ],
        name: "ERC20InsufficientBalance",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "approver",
                type: "address",
            },
        ],
        name: "ERC20InvalidApprover",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "receiver",
                type: "address",
            },
        ],
        name: "ERC20InvalidReceiver",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "sender",
                type: "address",
            },
        ],
        name: "ERC20InvalidSender",
        type: "error",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "ERC20InvalidSpender",
        type: "error",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "Approval",
        type: "event",
    },
    {
        anonymous: false,
        inputs: [
            {
                indexed: true,
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                indexed: true,
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                indexed: false,
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "Transfer",
        type: "event",
    },
    {
        inputs: [],
        name: "DECIMALS",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "owner",
                type: "address",
            },
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
        ],
        name: "allowance",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "spender",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "approve",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "account",
                type: "address",
            },
        ],
        name: "balanceOf",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "decimals",
        outputs: [
            {
                internalType: "uint8",
                name: "",
                type: "uint8",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "name",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "symbol",
        outputs: [
            {
                internalType: "string",
                name: "",
                type: "string",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [],
        name: "totalSupply",
        outputs: [
            {
                internalType: "uint256",
                name: "",
                type: "uint256",
            },
        ],
        stateMutability: "view",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "transfer",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
    {
        inputs: [
            {
                internalType: "address",
                name: "from",
                type: "address",
            },
            {
                internalType: "address",
                name: "to",
                type: "address",
            },
            {
                internalType: "uint256",
                name: "value",
                type: "uint256",
            },
        ],
        name: "transferFrom",
        outputs: [
            {
                internalType: "bool",
                name: "",
                type: "bool",
            },
        ],
        stateMutability: "nonpayable",
        type: "function",
    },
] as const;

const ERC20_BYTECODE =
    "0x60a06040523480156200001157600080fd5b5060405162000e5e38038062000e5e8339810160408190526200003491620002b0565b83836003620000448382620003cc565b506004620000538282620003cc565b50505060ff821660805262000069338262000073565b50505050620004c0565b6001600160a01b038216620000a35760405163ec442f0560e01b8152600060048201526024015b60405180910390fd5b620000b160008383620000b5565b5050565b6001600160a01b038316620000e4578060026000828254620000d8919062000498565b90915550620001589050565b6001600160a01b03831660009081526020819052604090205481811015620001395760405163391434e360e21b81526001600160a01b038516600482015260248101829052604481018390526064016200009a565b6001600160a01b03841660009081526020819052604090209082900390555b6001600160a01b038216620001765760028054829003905562000195565b6001600160a01b03821660009081526020819052604090208054820190555b816001600160a01b0316836001600160a01b03167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef83604051620001db91815260200190565b60405180910390a3505050565b634e487b7160e01b600052604160045260246000fd5b600082601f8301126200021057600080fd5b81516001600160401b03808211156200022d576200022d620001e8565b604051601f8301601f19908116603f01168101908282118183101715620002585762000258620001e8565b81604052838152602092508660208588010111156200027657600080fd5b600091505b838210156200029a57858201830151818301840152908201906200027b565b6000602085830101528094505050505092915050565b60008060008060808587031215620002c757600080fd5b84516001600160401b0380821115620002df57600080fd5b620002ed88838901620001fe565b955060208701519150808211156200030457600080fd5b506200031387828801620001fe565b935050604085015160ff811681146200032b57600080fd5b6060959095015193969295505050565b600181811c908216806200035057607f821691505b6020821081036200037157634e487b7160e01b600052602260045260246000fd5b50919050565b601f821115620003c7576000816000526020600020601f850160051c81016020861015620003a25750805b601f850160051c820191505b81811015620003c357828155600101620003ae565b5050505b505050565b81516001600160401b03811115620003e857620003e8620001e8565b6200040081620003f984546200033b565b8462000377565b602080601f8311600181146200043857600084156200041f5750858301515b600019600386901b1c1916600185901b178555620003c3565b600085815260208120601f198616915b82811015620004695788860151825594840194600190910190840162000448565b5085821015620004885787850151600019600388901b60f8161c191681555b5050505050600190811b01905550565b80820180821115620004ba57634e487b7160e01b600052601160045260246000fd5b92915050565b60805161097b620004e36000396000818161012e0152610164015261097b6000f3fe608060405234801561001057600080fd5b50600436106100be5760003560e01c8063313ce5671161007657806395d89b411161005b57806395d89b41146101be578063a9059cbb146101c6578063dd62ed3e146101d957600080fd5b8063313ce5671461016257806370a082311461018857600080fd5b806318160ddd116100a757806318160ddd1461010457806323b872dd146101165780632e0f26251461012957600080fd5b806306fdde03146100c3578063095ea7b3146100e1575b600080fd5b6100cb61021f565b6040516100d89190610790565b60405180910390f35b6100f46100ef366004610826565b6102b1565b60405190151581526020016100d8565b6002545b6040519081526020016100d8565b6100f4610124366004610850565b6102cb565b6101507f000000000000000000000000000000000000000000000000000000000000000081565b60405160ff90911681526020016100d8565b7f0000000000000000000000000000000000000000000000000000000000000000610150565b61010861019636600461088c565b73ffffffffffffffffffffffffffffffffffffffff1660009081526020819052604090205490565b6100cb6102ef565b6100f46101d4366004610826565b6102fe565b6101086101e73660046108ae565b73ffffffffffffffffffffffffffffffffffffffff918216600090815260016020908152604080832093909416825291909152205490565b60606003805461022e906108e1565b80601f016020809104026020016040519081016040528092919081815260200182805461025a906108e1565b80156102a75780601f1061027c576101008083540402835291602001916102a7565b820191906000526020600020905b81548152906001019060200180831161028a57829003601f168201915b5050505050905090565b6000336102bf81858561030c565b60019150505b92915050565b6000336102d985828561031e565b6102e48585856103f2565b506001949350505050565b60606004805461022e906108e1565b6000336102bf8185856103f2565b610319838383600161049d565b505050565b73ffffffffffffffffffffffffffffffffffffffff8381166000908152600160209081526040808320938616835292905220547fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffff81146103ec57818110156103dd576040517ffb8f41b200000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8416600482015260248101829052604481018390526064015b60405180910390fd5b6103ec8484848403600061049d565b50505050565b73ffffffffffffffffffffffffffffffffffffffff8316610442576040517f96c6fd1e000000000000000000000000000000000000000000000000000000008152600060048201526024016103d4565b73ffffffffffffffffffffffffffffffffffffffff8216610492576040517fec442f05000000000000000000000000000000000000000000000000000000008152600060048201526024016103d4565b6103198383836105e5565b73ffffffffffffffffffffffffffffffffffffffff84166104ed576040517fe602df05000000000000000000000000000000000000000000000000000000008152600060048201526024016103d4565b73ffffffffffffffffffffffffffffffffffffffff831661053d576040517f94280d62000000000000000000000000000000000000000000000000000000008152600060048201526024016103d4565b73ffffffffffffffffffffffffffffffffffffffff808516600090815260016020908152604080832093871683529290522082905580156103ec578273ffffffffffffffffffffffffffffffffffffffff168473ffffffffffffffffffffffffffffffffffffffff167f8c5be1e5ebec7d5bd14f71427d1e84f3dd0314c0f7b2291e5b200ac8c7c3b925846040516105d791815260200190565b60405180910390a350505050565b73ffffffffffffffffffffffffffffffffffffffff831661061d5780600260008282546106129190610934565b909155506106cf9050565b73ffffffffffffffffffffffffffffffffffffffff8316600090815260208190526040902054818110156106a3576040517fe450d38c00000000000000000000000000000000000000000000000000000000815273ffffffffffffffffffffffffffffffffffffffff8516600482015260248101829052604481018390526064016103d4565b73ffffffffffffffffffffffffffffffffffffffff841660009081526020819052604090209082900390555b73ffffffffffffffffffffffffffffffffffffffff82166106f857600280548290039055610724565b73ffffffffffffffffffffffffffffffffffffffff821660009081526020819052604090208054820190555b8173ffffffffffffffffffffffffffffffffffffffff168373ffffffffffffffffffffffffffffffffffffffff167fddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef8360405161078391815260200190565b60405180910390a3505050565b60006020808352835180602085015260005b818110156107be578581018301518582016040015282016107a2565b5060006040828601015260407fffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffffe0601f8301168501019250505092915050565b803573ffffffffffffffffffffffffffffffffffffffff8116811461082157600080fd5b919050565b6000806040838503121561083957600080fd5b610842836107fd565b946020939093013593505050565b60008060006060848603121561086557600080fd5b61086e846107fd565b925061087c602085016107fd565b9150604084013590509250925092565b60006020828403121561089e57600080fd5b6108a7826107fd565b9392505050565b600080604083850312156108c157600080fd5b6108ca836107fd565b91506108d8602084016107fd565b90509250929050565b600181811c908216806108f557607f821691505b60208210810361092e577f4e487b7100000000000000000000000000000000000000000000000000000000600052602260045260246000fd5b50919050565b808201808211156102c5577f4e487b7100000000000000000000000000000000000000000000000000000000600052601160045260246000fdfea164736f6c6343000817000a";

export { ERC20_ABI, ERC20_BYTECODE };
