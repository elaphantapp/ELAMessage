


class ElaMessage {

	constructor(crypton) {
		this._crypton = crypton;
	}

	setName(name) {
		if (this._mynames && this._mynames.find(name)) {
			return;
		}
		else if (!this._mynames) {
			this._mynames = [];
		}

		this._mynames.push(name);
	}

	getMyNames(eladdress) {
		return this._mynames;
	}

	async getMyMessages(elaAddress, cmd, name, page, size) {
		if (cmd !="MSG" && cmd != "WAL") return "";

		var pthis = this;
		return this.getRawMessages(elaAddress, cmd, page, size).then(function(ret) {
			var result = [];
			for (var item of ret) {
				(function() {
					var fromAddress = item.input;
					var obj = item;
					if (elaAddress != fromAddress) {
						pthis._getKeyOfName(obj.f, "ela.address").then (function(address) {
							if (address == fromAddress)
								obj["verify"] = true;
						})
					}
				})();
				if (!name || name=="" || (item.t == name || item.f == name)) {
					item.f = item.f.toLowerCase();
					item.t = item.t.toLowerCase();
					item.m = decodeURIComponent(item.m);
				}
			}
			return ret;
		});
	}

	async sendMessage(sender, receiver, replyto, cmd, message, amount) {
		if (cmd !="MSG" && cmd != "WAL") return "";
		var pthis = this;
		var nameInfo;
		return this._getNameInfo(receiver).then(function(obj) {
			nameInfo = obj;
			return pthis._getOwner(receiver).then(function(owner) {

				if (pthis._verifyMessagerName(nameInfo, owner)) {
					var msg = {
						"f":sender.toLowerCase(),
						"t":receiver.toLowerCase(),
						"r":replyto,
						"m":encodeURIComponent(message)
					};
					var address = nameInfo["ela.address"];

					return pthis.generatSendRequirment(address, cmd, msg, amount);
				}

			})
		});

	}

	getRawMessages(elaAddress, cmd, page, size) {
		return fetch('https://node1.elaphant.app/api/v3/history/' + elaAddress + '?' + "pageSize="+size+"&pageNum="+(page+1)+"&order=desc").then(function(response) {
			    return response.json();
			}).then(function(ret) {
				var result = [];
				for (var item of ret.result.History) {
					var memo = item.Memo;
					var start = memo.indexOf("type:text,msg:OrderID=");
					if (start >= 0) {
						var msg = memo.substr(start+22);
						try {
							var ret = msg.split(":");
							if (ret[0] == cmd) {
								(function() {
									var obj = JSON.parse(atob(ret[1]));
									obj["txid"] = item.Txid;
									obj["input"] = item.Inputs[0];
									obj["output"] = item.Outputs[0];
									obj["height"] = item.Height;
									obj["amount"] = item.Value - item.NodeFee;
									obj["timestamp"] = item.CreateTime;
									obj["verify"] = false;
									result.push(obj);
								})();
							}
						}
						catch (err) {
							console.log(err);
						}
					}
				}
				return result;
			});
	}

	generatSendRequirment(address, cmd, jsonData, amount) {
		var base64 = btoa(JSON.stringify(jsonData));
		var url = "https://launch.elaphant.app/?appName=CryptoName&appTitle=CryptoName&autoRedirect=True&redirectURL="+
					"elaphant%3A%2F%2Felapay%3FDID%3DibxNTG1hBPK1rZuoc8fMy4eFQ96UYDAQ4J%26"+
					"AppID%3Dac89a6a3ff8165411c8426529dccde5cd44d5041407bf249b57ae99a6bfeadd60f74409bd5a3d81979805806606dd2d55f6979ca467982583ac734cf6f55a290%26"+
					"AppName%3DMini%2520Apps%26Description%3DMini%2520Apps%26PublicKey%3D034c51ddc0844ff11397cc773a5b7d94d5eed05e7006fb229cf965b47f19d27c55%26"+
					"OrderID%3D"+cmd+"%3A"+base64+"%26CoinName%3DELA%26"+
					"ReceivingAddress%3D"+address+"%26ReturnUrl%3Dhttps%3A%2F%2Fsjunsong.elastos.name%26Amount%3D"+amount;
		return url;
	}

	async _getOwner(name) {
		var cache = localStorage.getItem(name+"_getOwner");
		if (cache) {
			return JSON.parse(cache).value;
		}
		return this._crypton.getOwnerOfNameToken(name).then(function(value) {
			localStorage.setItem(name+"_getOwner", JSON.stringify({"timestamp": Date.now(), "value":value}));
			return value;
		});
	}

	async _getNameInfo(name) {
		var cache = localStorage.getItem(name+"_getNameInfo");
		if (cache) {
			return JSON.parse(cache).value;
		}
		return Crypton.QueryName(name).then(function(value) {
			localStorage.setItem(name+"_getNameInfo", JSON.stringify({"timestamp": Date.now(), "value":value}));

			return value;
		});
	}

	async _getKeyOfName(name, key) {
		var cache = localStorage.getItem(name+"_getKeyOfName_"+key);
		if (cache) {
			return JSON.parse(cache).value;
		}
		return Crypton.QueryKey(name, key).then(function(value) {
			localStorage.setItem(name+"_getKeyOfName_"+key, JSON.stringify({"timestamp": Date.now(), "value":value}));

			return value;
		});
	}

	_verifyMessageWallName(nameObject, owner) {
		if (getDid(nameObject.publickey) != nameObject.did 
			|| getAddress(nameObject.publickey) != nameObject["ela.address"])
			return false;
		return verify(nameObject.name+".elastos.namemessagewall"+owner, nameObject.messagewall, nameObject.publickey);
	}

	_verifyMessagerName(nameObject, owner) {
		if (getDid(nameObject.publickey) != nameObject.did 
			|| getAddress(nameObject.publickey) != nameObject["ela.address"])
			return false;
		return verify(nameObject.name+".elastos.namemessenger"+owner, nameObject.messenger, nameObject.publickey);
	}
};