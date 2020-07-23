
class Crypton {

	static async QueryName(name) {
		return fetch("https://"+name+".elastos.name/info.json")
  			.then(response => response.json())
			.then (result => {
				return result;
			});
	}

	static async QueryKey(name, key) {
		return fetch("https://"+name+".elastos.name/"+key)
			.then (result => {
				return result.text();
			})
			.catch(function(err){
				console.log(err);
				return undefined;
			});
	}

	constructor (abiArray, contractAddress, web3) {
		this._web3 = web3;
		this._contact = new this._web3.eth.Contract(abiArray, contractAddress);
	}

	async _init_account (force) {
		if (!force && this._account) return this._account;

		var pthis = this;
		return this._web3.eth.getAccounts()
			.then(function(accounts) {
				if (!pthis._account || pthis._account != accounts[0]) {
					pthis._account = accounts[0];
				}
				return pthis._account;
			});
	}

	async _generate_option (price) {
		var pthis = this;
		return this._web3.eth.getGasPrice()
			.then(function(gasPrice) {
				if (price)
					return { from: pthis._account, gasPrice: gasPrice, gas: 1000000, value: pthis._web3.utils.toWei(price, "ether") };
				else
					return { from: pthis._account, gasPrice: gasPrice, gas: 1000000, value:'0' };
			});
	}

	async getOwnerOfNameToken (name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		var tokenId = pthis._web3.utils.hexToNumberString("0x"+sha256(name));
        		return pthis._contact.methods.ownerOf(tokenId).call();
			})
			.catch(function(){
				return "";
			});
	}

	async getTokenNameCount () {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.totalSupply().call();
			})
			.catch(function(){
				return 0;
			});
	}

	async getNameTokens (start, end) {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.totalSupply().call();
			})
			.then(function(count) {
				var result = [];
				var pool = [];

				for (var i=start; i<count && (!end || i<end); i++) {
					(function(){
						var tokenid, owner, name, expiration, price;

						pool.push(pthis._contact.methods.tokenByIndex(i).call()
							.then(function(ret) {
								tokenid = ret;
								return pthis._contact.methods.ownerOf(tokenid).call();
							})
							.then(function(ret) {
								owner = ret;
								return pthis._contact.methods.tokenURI(tokenid).call();
							})
							.then(function(ret) {
								name = ret;
								return pthis._contact.methods.tokenExpiration(tokenid).call();
							})
							.then(function(ret) {
								expiration = ret;
								return pthis._contact.methods.tokenPrice(tokenid).call();
							})
							.then(function(ret) {
								price = ret;
								result.push({
									"tokenId": tokenid,
									"name": name,
									"owner": owner,
									"expiration": expiration,
									"price": pthis._web3.utils.fromWei(price, "ether")
								});
							}));
					})();
				}

				return Promise.all(pool).then(() =>{
					return result;
				});
			})
			.catch(function(){
				return [];
			});
	}

	async getOwnerNameTokens (address) {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.balanceOf(address).call();
			})
			.then(async function(count) {
				var result = [];
				var pool = [];

				for (var i=0; i<count; i++) {
					(function() {
						var tokenid, owner, name, expiration, price;

						pool.push(pthis._contact.methods.tokenOfOwnerByIndex(address, i).call()
							.then(function(ret) {
								tokenid = ret;
								return pthis._contact.methods.tokenURI(tokenid).call();
							})
							.then(function(ret) {
								name = ret;
								return pthis._contact.methods.tokenExpiration(tokenid).call();
							})
							.then(function(ret) {
								expiration = ret;
								return pthis._contact.methods.tokenPrice(tokenid).call();
							})
							.then(function(ret) {
								price = ret;
								result.push({
									"tokenId": tokenid,
									"name": name,
									"owner": owner,
									"expiration": expiration,
									"price": pthis._web3.utils.fromWei(price, "ether")
								});
							}));
					})();
				}
				return Promise.all(pool).then(() =>{
					return result;
				});
			})
			.catch(function(){
				return [];
			});
	}

	async getContractOwner () {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.owner().call();
			})
			.catch(function(){
				return "";
			});
	}

	async getImplementContract () {
		var pthis = this;
		return this._init_account()
			.then(function() {
        		return pthis._contact.methods.implementation_slot().call();
			})
			.catch(function(){
				return "";
			});
	}

	async getCurrentPrice (level) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				if (level == 1) {
					return pthis._contact.methods.price_level1().call();
				}
				else if (level == 2) {
					return pthis._contact.methods.price_level2().call();
				}
				else if (level == 3) {
					return pthis._contact.methods.price_level3().call();
				}
			})
			.then(function(x) {
				return pthis._web3.utils.fromWei(x, "ether");
			})
			.catch(function(){
				return -1;
			});
	}

	async getRenewalPrice (level) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				if (level == 1) {
					return pthis._contact.methods.renewal_level1().call();
				}
				else if (level == 2) {
					return pthis._contact.methods.renewal_level2().call();
				}
				else if (level == 3) {
					return pthis._contact.methods.renewal_level3().call();
				}
			})
			.then(function(x) {
				return pthis._web3.utils.fromWei(x, "ether");
			})
			.catch(function(){
				return -1;
			});
	}

	async getNamesCount (level) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				if (level == 1) {
					return pthis._contact.methods.count_level1().call();
				}
				else if (level == 2) {
					return pthis._contact.methods.count_level2().call();
				}
				else if (level == 3) {
					return pthis._contact.methods.count_level3().call();
				}
			})
			.then(function(x) {
				return pthis._web3.utils.fromWei(x, "ether");
			})
			.catch(function(){
				return -1;
			});
	}

	async getExpiration (name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				var tokenId = pthis._web3.utils.hexToNumberString("0x"+sha256(name));
				return pthis._contact.methods.tokenExpiration(tokenId).call();
			})
			.catch(function(){
				return -1;
			});
	}

	async transfer (to, name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option("0.1");
			})
			.then(function(option) {
        		return pthis._contact.methods.transfer(pthis._account, to, name).send(option);
			});
	}

	async renew (to, name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis.getRenewalPrice(name);
			})
			.then(function(price) {
				return pthis._generate_option(price);
			})
			.then(function(option) {
        		return pthis._contact.methods.renewToken(pthis._account, to, name).send(option);
			});
	}

	async registerName (name, price) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option(price);
			})
			.then(function(option) {
				return pthis._contact.methods.externalMint(name).send(option);	
			});
	}

	async generateName (to, name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				return pthis._contact.methods.mint(to, name).send(option);
			});
	}

	async approveName (to, name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				var tokenId = pthis._web3.utils.hexToNumberString("0x"+sha256(name));
				return pthis._contact.methods.approve(to, tokenId).send(option);
			});
	}

	async recycleToken (name) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				return pthis._contact.methods.recycleToken(name).send(option);
			});
	}

	async setBasicInfo (name, btc, eth, ela, did, pubkey) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				return pthis._contact.methods.setBasicInfo(name, btc, eth, ela, did, pubkey).send(option);
			});
	}

	async setKeyword (name, key, value) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				return pthis._contact.methods.setKeyword(name, key, value).send(option);
			});
	}

	async withdraw (value) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				return pthis._contact.methods.withdraw(value).send(option);
			});
	}

	async getKeyword (name, key) {
		var pthis = this;
		return this._init_account()
			.then(function(option) {
				return pthis._contact.methods.getKeyword(name, key).call();
			});
	}

	async getAllKeywords (name) {
		var pthis = this;
		return this._init_account()
			.then(function(option) {
				return pthis._contact.methods.getAllKeywords(name).call();
			});
	}

	async getNameProfile (name) {
		var nameInfo = {"name":name};
		var pthis = this;
		return this._init_account()
			.then(function(option) {
				return pthis._contact.methods.getAllKeywords(name).call();
			})
			.then (function(value) {
				var keys = value.split(",");

				var promises = [];

				for (var key of keys) {
				
					(function(k) {
						promises.push(pthis.getKeyword(name, k).then(function(v) {
							nameInfo[k] = v;
						}));
					})(key);
				}
				return Promise.all(promises);
			})
			.then (function (ret) {
				return nameInfo;
			});
	}

	async removeKeyword (name, key) {
		var pthis = this;
		return this._init_account()
			.then(function() {
				return pthis._generate_option();
			})
			.then(function(option) {
				return pthis._contact.methods.removeKeyword(name, key).send(option);
			});
	}

};