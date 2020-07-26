


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
			if (!ret || ret.length <= 0) return;


			var result = [];

			var lastLoadDataKey = elaAddress+"_"+cmd+"_lasttimestamp";
			var lastLoadDatatimestamp = parseInt(localStorage.getItem(lastLoadDataKey));

			if (!lastLoadDatatimestamp) lastLoadDatatimestamp = 0;
			var lastItemTimeStamp = lastLoadDatatimestamp;

			for (var item of ret) {
				if ( !name || name=="" || (cmd == "WAL" && item.t == name && (item.f != "www" || item.amount >= 1000000)) || ( cmd == "MSG" && (item.f == name || item.t == name)) ) {
					(function() {
						var fromAddress = item.input;
						var obj = item;
						if (elaAddress != fromAddress) {
							pthis._checkKeyOfName(obj.f, "ela.address", fromAddress).then (function(verified) {
								obj["verify"] = verified;
							})
						}
					})();

					item.f = item.f.toLowerCase();
					item.t = item.t.toLowerCase();
					item.m = decodeURIComponent(item.m);

					if (item.f == "www") item.f+="[guest]"

					result.push(item);

					if (lastLoadDatatimestamp < item.timestamp) {
						var itemkey = currentDID+"_"+currentName;
						var itemcountkey = currentDID+"_"+currentName;
						if (cmd == "MSG") {
							var targetname = name==item.t?item.f:item.t;
							itemkey += "_@"+targetname+"_lastreadmessage";
							itemcountkey += "_@"+targetname+"_unreadmessage";
						}
						else if (cmd == "WAL") {
							itemkey += "_#"+name+"_lastreadmessage";
							itemcountkey += "_#"+name+"_unreadmessage";
						}
						var lasttimestamp = localStorage.getItem(itemkey);
						if (!lasttimestamp) lasttimestamp = 0;

						var count = localStorage.getItem(itemcountkey);
						if (!count) {
							count = 0;
							localStorage.setItem(itemcountkey, 0);
						}
						if (lasttimestamp < item.timestamp) {
							localStorage.setItem(itemcountkey, parseInt(count) + 1);
						}
						if (lastItemTimeStamp < item.timestamp) {
							lastItemTimeStamp = parseInt(item.timestamp);
							localStorage.setItem(lastLoadDataKey, lastItemTimeStamp);
						}	
					}
				}
			}
			
			return result;
		});
	}

	getRawMessages(elaAddress, cmd, page, size) {
		return fetch('https://node1.elaphant.app/api/v3/history/' + elaAddress + '?' + "pageSize="+size+"&pageNum="+(page+1)+"&order=desc").then(function(response) {
			    return response.json();
			}).then(function(ret) {
				if (!ret.result.History)
					return undefined;

				var result = [];
				for (var item of ret.result.History) {
					var memo = item.Memo;
					var start = memo.indexOf("type:text,msg:OrderID=");
					if (start >= 0) {
						var msg = memo.substr(start+22);
						try {
							var ret = msg.split(":");

							if (ret[0] == cmd) {
								var obj = JSON.parse(atob(ret[1]));
								obj["txid"] = item.Txid;
								obj["input"] = item.Inputs[0];
								obj["output"] = item.Outputs[0];
								obj["height"] = item.Height;
								obj["amount"] = (item.Type=="income") ? item.Value : (item.Value - item.Fee);
								obj["timestamp"] = item.CreateTime==0?parseInt(Date.now()/1000):item.CreateTime;
								obj["verify"] = false;
								result.push(obj);
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

	async sendMessage(sender, receiver, replyto, cmd, message, amount, returnUrl) {
		if (cmd !="MSG" && cmd != "WAL") return "";

		var pthis = this;
		return this._getKeyOfName(receiver, "ela.address").then(function(addr) {
			var msg = {
				"f":sender.toLowerCase(),
				"t":receiver.toLowerCase(),
				"r":replyto,
				"m":encodeURIComponent(message)
			};

			return pthis.generatSendRequirment(addr, cmd, msg, amount, returnUrl);
		});
	}

	generatSendRequirment(_address, _cmd, _jsonData, _amount, _returnUrl) {
		//var base64 = btoa(JSON.stringify(jsonData));

		var appTitle = "CryptoName";
		var developerDID = "ibxNTG1hBPK1rZuoc8fMy4eFQ96UYDAQ4J";
		var appID = "ac89a6a3ff8165411c8426529dccde5cd44d5041407bf249b57ae99a6bfeadd60f74409bd5a3d81979805806606dd2d55f6979ca467982583ac734cf6f55a290";
		var appName = "Mini Apps";
		var publicKey = "034c51ddc0844ff11397cc773a5b7d94d5eed05e7006fb229cf965b47f19d27c55";
		var returnUrl = _returnUrl || "https://elamessage.elaphant.app";
		var orderID = _cmd+":"+btoa(JSON.stringify(_jsonData));

		var elaphantURL = "elaphant://elapay?DID=" + developerDID +
						 "&AppID=" + appID +
						 "&AppName=" + encodeURIComponent(appName) +
						 "&Description=" + encodeURIComponent(appName) +
						 "&PublicKey="+ publicKey +
						 "&OrderID=" + orderID +
						 "&CoinName=ELA"+
						 "&ReceivingAddress=" + _address +
						 "&Amount=" + _amount +
						 "&ReturnUrl=" + encodeURIComponent(returnUrl);

		var url = "https://launch.elaphant.app/?appName="+encodeURIComponent(appTitle)+
				  	"&appTitle="+encodeURIComponent(appTitle)+
				  	"&autoRedirect=True&redirectURL="+encodeURIComponent(elaphantURL);
					

		// var url = "https://launch.elaphant.app/?appName=CryptoName&appTitle=CryptoName&autoRedirect=True&redirectURL="+
		// 			"elaphant%3A%2F%2Felapay%3FDID%3DibxNTG1hBPK1rZuoc8fMy4eFQ96UYDAQ4J%26"+
		// 			"AppID%3Dac89a6a3ff8165411c8426529dccde5cd44d5041407bf249b57ae99a6bfeadd60f74409bd5a3d81979805806606dd2d55f6979ca467982583ac734cf6f55a290%26"+
		// 			"AppName%3DMini%2520Apps%26Description%3DMini%2520Apps%26PublicKey%3D034c51ddc0844ff11397cc773a5b7d94d5eed05e7006fb229cf965b47f19d27c55%26"+
		// 			"OrderID%3D"+cmd+"%3A"+base64+"%26CoinName%3DELA%26"+
		// 			"ReceivingAddress%3D"+address+"%26ReturnUrl%3Dhttps%3A%2F%2Felamessage.elaphant.app%26Amount%3D"+amount;
		return url;
	}

	async _getOwner(name, force) {
		var cache = localStorage.getItem(name+"_getOwner");
		if (cache && !force) {
			return JSON.parse(cache).value;
		}
		return this._crypton.getOwnerOfNameToken(name).then(function(value) {
			localStorage.setItem(name+"_getOwner", JSON.stringify({"timestamp": Date.now(), "value":value}));
			return value;
		});
	}

	async _getNameInfo(name, force) {
		var cache = localStorage.getItem(name+"_getNameInfo");
		if (cache && !force) {
			return JSON.parse(cache).value;
		}
		return Crypton.QueryName(name).then(function(value) {
			localStorage.setItem(name+"_getNameInfo", JSON.stringify({"timestamp": Date.now(), "value":value}));

			return value;
		});
	}

	async _checkKeyOfName(name, key, value) {
		var cache = localStorage.getItem(name+"_getKeyOfName_"+key);
		if (cache) {
			if (JSON.parse(cache).value == value)
				return true;
		}
		return Crypton.QueryKey(name, key).then(function(val) {
			localStorage.setItem(name+"_getKeyOfName_"+key, JSON.stringify({"timestamp": Date.now(), "value":val}));

			return val == value;
		}, function(err) {console.log(err); return false;}).catch(err => {
			console.log(err);
			return false;
		});
	}

	async _getKeyOfName(name, key, force) {
		var cache = localStorage.getItem(name+"_getKeyOfName_"+key);
		if (cache && !force) {
			return JSON.parse(cache).value;
		}
		return Crypton.QueryKey(name, key).then(function(value) {
			localStorage.setItem(name+"_getKeyOfName_"+key, JSON.stringify({"timestamp": Date.now(), "value":value}));

			return value;
		});
	}

	_verifyMessageWallName(nameObject, owner) {
		if (getDid(nameObject.publickey).toLowerCase() != nameObject.did.toLowerCase() 
			|| getAddress(nameObject.publickey).toLowerCase() != nameObject["ela.address"].toLowerCase())
			return false;
		return verify(nameObject.name.toLowerCase()+".elastos.namemessagewall"+owner.toLowerCase(), nameObject.messagewall, nameObject.publickey);
	}

	_verifyMessagerName(nameObject, owner) {
		if (getDid(nameObject.publickey).toLowerCase() != nameObject.did.toLowerCase()
			|| getAddress(nameObject.publickey).toLowerCase() != nameObject["ela.address"].toLowerCase())
			return false;
		return verify(nameObject.name.toLowerCase()+".elastos.namemessenger"+owner.toLowerCase(), nameObject.messenger, nameObject.publickey);
	}
};