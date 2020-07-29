$(function () {

	PullToRefresh.init({
        mainElement: 'body',
        onRefresh: function() { 
        	window.location.href = window.location.href.split('?')[0];
        }
    });

	$('[data-toggle="offcanvas"]').on('click', function () {
		$('.offcanvas-collapse').toggleClass('open')
	})

	window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainrpc.elaeth.io"));
	if (!web3) {
		console.log("Can't init Web3 Provider, please check your network.")
		return;
	}

	window.crypton = new Crypton(abiArray, "0xc4032babad2b76c39abec3c4e365611de78528ed", web3);

	window.elaMsg = new ElaMessage(crypton);

	var setProfile = function(key, value) {
		return localStorage.setItem(key, value);
	};

	var getProfile = function(key) {
		return localStorage.getItem(key);
	};

	var removeProfile = function(key) {
		return localStorage.removeItem(key);
	}

	var loginElaphant = function() {
		var random = Math.floor(Math.random() * 100000000);
		setProfile("random", random);
		var url = "https://launch.elaphant.app/?appName=ELAMessenger&appTitle=ELAMessenger&autoRedirect=True&redirectURL=elaphant%3A%2F%2Fidentity%3FAppID%3Dac89a6a3ff8165411c8426529dccde5cd44d5041407bf249b57ae99a6bfeadd60f74409bd5a3d81979805806606dd2d55f6979ca467982583ac734cf6f55a290%26AppName%3DMini%20Apps%26RandomNumber%3D"+random+"%26DID%3DibxNTG1hBPK1rZuoc8fMy4eFQ96UYDAQ4J%26PublicKey%3D034c51ddc0844ff11397cc773a5b7d94d5eed05e7006fb229cf965b47f19d27c55%26ReturnUrl%3Dhttps%253A%252F%252Felamessenger.elaphant.app%26RequestInfo%3DELAAddress%2CBTCAddress%2CETHAddress"
		window.location.href = url;		
	}

	const url = new URL(window.location.href);
	url.searchParams.delete('OrderID');
	url.searchParams.delete('TXID');
	var entryURL = url.href;

	let params = new URLSearchParams(url.search.substring(1));
	var identityData = params.get("Data");
	var currentDID = params.get("did");
	var currentName = params.get("name");
	var currentAddress = params.get("address");


	if (identityData) {
		var identity = JSON.parse(identityData);
		var sign = params.get("Sign");

		if ( verify(identityData, sign, identity.PublicKey) && identity.RandomNumber == getProfile("random") ) {
			currentDID = identity.DID;
			currentAddress = identity.ELAAddress;
		}
		else {
			alert("Failed to log in to Elephant Wallet, please try again");
			return;
		}

		setProfile("currentDID", currentDID);
		setProfile(currentDID+"_currentAddress", currentAddress);

		removeProfile(currentDID+"_currentName");

		window.settingNameDialog = new Vue({
			el:"#settingNameDialog",
			data: {
				"myName":""
			},
			methods: {
				async save() {
					var myName = this.myName.trim().toLowerCase();

					var owner = await elaMsg._getOwner(myName);
					var nameInfo = await elaMsg._getNameInfo(myName);

					if (nameInfo["ela.address"] != currentAddress || nameInfo["did"] != currentDID) {
						alert("Please set the name corresponding to the elephant wallet.");
						$("#settingNameDialog").modal("hide");
						loginElaphant();
						return;
					}

					if (elaMsg._verifyMessagerName(nameInfo, owner)) {
						alert("Set name successfully!");
						currentName = myName;
						setProfile(currentDID+"_currentName", currentName);
						$("#settingNameDialog").modal("hide");
						window.location.href = window.location.href.split('?')[0];
					}
					else {
						alert("The \"Messenger\" is not enabled for the name you set, please go to the CryptoName website to set it up");
						$("#settingNameDialog").modal("hide");
						loginElaphant();
					}
				}
			},
			created () {

			}
		});


		$("#settingNameDialog").modal("show");

	}
	else if (!currentDID || !currentName || !currentAddress) {
		currentDID = getProfile("currentDID");
		if (!currentDID)
			return loginElaphant();
		currentName = getProfile(currentDID+"_currentName");
		currentAddress = getProfile(currentDID+"_currentAddress");

		if (!currentName || !currentAddress)
			return loginElaphant();
	}

	window.currentDID = currentDID;
	window.currentName = currentName;
	window.currentAddress = currentAddress;
	window.returnURL = window.location.href.split('?')[0];


	window.escapeHTML = function(a){
	    a = "" + a;  
	    return a.replace(/&/g, "&").replace(/</g, "<").replace(/>/g, ">").replace(/"/g, '"').replace(/'/g, "'");
	};

	window.groupBy = function(xs, myname) {
		var ret = {};
		for (var x of xs) {
	  		var key = myname == x['f'] ? "t" : "f";
	    	(ret[x[key]] = ret[x[key]] || []).push(x);
		}
		return ret;
	};

	window.messageWall = new Vue({
		el:"#messageWall",
		data: {
			"following": [],
			"followingData": {"burn":[], "elaphant":[], "bbs":[]}
		},
		methods: {

		},
		created () {
			var pthis = this;

			var myFollowing = getProfile(currentDID+"_following");
			if (myFollowing) {
				var temps = JSON.parse(myFollowing);
				for (var item of temps) {
					this.followingData[item] = [];
				}
			}

			for (var key in this.followingData) {
				(async function() {
					var target = key;

					elaMsg._getKeyOfName(target, "ela.address", true).then (function(address) {
						if (!address || address.length < 34 )
							return;
						return elaMsg.getMyMessages(address, "WAL", target, 0, 300);
					}).then (function(result) {
						if (result && result.length > 0) {
							pthis.following.push({"key":target, "value":result, "unread": localStorage.getItem(currentDID+"_"+currentName+"_#"+target+"_unreadmessage")});
						}
						else {
							pthis.following.push({"key":target, "value":[], "unread": 0});
						}
					}).catch (err => {
						console.log(err);
					})
				})();
			}
		}
	});

	window.personalMessage = new Vue({
		el:"#personalMessage",
		data: {
			"messages": []
		},
		methods: {
		},
		created () {
			var pthis = this;
			elaMsg.getMyMessages(currentAddress, "MSG", currentName, 0, 100).then(function(data) {
				if (!data || data.length<=0) return;
				var tmpMessages = groupBy(data, currentName);
	  			for (var item in tmpMessages) {
	  				pthis.messages.push({
	  					"key": item,
	  					"value": tmpMessages[item],
	  					"unread": localStorage.getItem(currentDID+"_"+currentName+"_@"+item+"_unreadmessage")
	  				});
	  			}
			})
		}
	});

	window.cryptoNameListView = new Vue({
		el:"#cryptoNameListView",
		data: {
			"messages":[],
			"type":""
		},
		methods: {

		},
		created () {
		}
	});
	$('#cryptoNameListView').on('show.bs.modal', function (e) {
		var button = $(e.relatedTarget);
  		var target = button.data('whatever');

  		if (target.indexOf("messages") == 0) {
  			cryptoNameListView.messages = [];
  			cryptoNameListView.type = "messages";
  			cryptoNameListView.messages = personalMessage.messages;
  		}
  		else if (target.indexOf("channel") == 0) {
  			cryptoNameListView.messages = messageWall.following;
  			cryptoNameListView.type = "channel";
  		}

	});

	window.messagesListView = new Vue({
		el:"#messagesListView",
		data: {
			"cryptoname":"",
			"title":"",
			"type":"",
			"cmd":"",
			"messages":[],
			"keyword":""
		},
		methods: {
		},
		created () {

		}
	});
	$('#messagesListView').on('show.bs.modal', function (e) {
		var button = e.relatedTarget;
  		var target = button.dataset['whatever'];

  		if (target.indexOf("messages") == 0) {
  			var name = $(e.relatedTarget).find(".mb-1").text();
  			messagesListView.cryptoname = name.substring(1);
  			messagesListView.title = name+" Messages";
  			messagesListView.type = "Reply";
  			messagesListView.cmd = "MSG";
  			for (var index in personalMessage.messages) {
  				var item = personalMessage.messages[index];
  				if (item.key == messagesListView.cryptoname) {
  					messagesListView.messages = item.value;
  					item.unread = 0;
  					personalMessage.messages.splice(index, 1, item);
  					break;
  				}
  			}

  			localStorage.setItem(currentDID+"_"+currentName+"_@"+messagesListView.cryptoname+"_lastreadmessage", messagesListView.messages[0] ? messagesListView.messages[0].timestamp : 0);
  			localStorage.setItem(currentDID+"_"+currentName+"_@"+messagesListView.cryptoname+"_unreadmessage", 0);
  		}
  		else if (target.indexOf("channel") == 0) {
  			var name = $(e.relatedTarget).find(".mb-1").text();
  			messagesListView.cryptoname = name.substring(1);
  			messagesListView.title = name+" Channel";
  			messagesListView.type = "Post";
  			messagesListView.cmd = "WAL";
  			for (var index in messageWall.following) {
  				var item = messageWall.following[index];
  				if (item.key == messagesListView.cryptoname) {
  					messagesListView.messages = item.value;
  					item.unread = 0;
  					messageWall.following.splice(index, 1, item);
  					break;
  				}
  			}
  			localStorage.setItem(currentDID+"_"+currentName+"_#"+messagesListView.cryptoname+"_lastreadmessage", messagesListView.messages[0] ? messagesListView.messages[0].timestamp : 0);
  			localStorage.setItem(currentDID+"_"+currentName+"_#"+messagesListView.cryptoname+"_unreadmessage", 0);
  		}
	});

	window.newSubscriptionDialog = new Vue({
		el:"#newSubscriptionDialog",
		data: {
			"subscriptionName":""
		},
		methods: {
			save() {
				var subscription = this.subscriptionName.trim().toLowerCase();

				messageWall.following[subscription] = [];

				var temps = [];
				var myFollowing = getProfile(currentDID+"_following");
				if (myFollowing) {
					temps = JSON.parse(myFollowing);
				}
				temps.push(subscription);
				setProfile(currentDID+"_following", JSON.stringify(temps));

				elaMsg._getKeyOfName(subscription, "ela.address").then(function(address) {
					return elaMsg.getMyMessages(address, "WAL", subscription, 0, 100);
				}).then(function(result) {
					messageWall.following.push({
						"key":subscription,
						"value":result,
						"unread":result.length
					});
				});
				$("#newSubscriptionDialog").modal("hide");
			}
		},
		created () {

		}
	});
	$('#newSubscriptionDialog').on('show.bs.modal', function (e) {

	});

	window.sendMessageDialog = new Vue({
		el:"#sendMessageDialog",
		data: {
			"cmd":"",
			"quote":"",
			"recipient":"",
			"messageBody": "",
			"recipientChecked": 0,
			"amount":0.000001
		},
		methods: {
			async checkRecipient() {
				var receiver = this.recipient.trim().toLowerCase(); 

				var bForce = false;

				do {
					var nameInfo = await elaMsg._getNameInfo(receiver, bForce);
					var owner = await elaMsg._getOwner(receiver, bForce);
					if ((this.cmd == "MSG" && elaMsg._verifyMessagerName(nameInfo, owner)) ||
						(this.cmd == "WAL" && elaMsg._verifyMessageWallName(nameInfo, owner))) {
						this.recipientChecked = 1;
						$("#receiver-name").css("color", "green").css("border-color", "green");
						return;
					}
					else {
						bForce = !bForce;
					}
				} while(bForce);

				this.recipientChecked = -1;
				$("#receiver-name").css("color", "red").css("border-color", "red");
			},
			checkSender() {

			},
			sendMessage() {
				var receiver = this.recipient.trim().toLowerCase();
				var message = this.messageBody.trim();
				var amount = this.amount;

				if (receiver.length < 1) {
					alert("Error: No receiver.");
					return;
				}
				if (message.length < 1) {
					alert("Error: No message.");
					return;
				}
				if (parseFloat(amount) < 0.000001) {
					alert("Error: The amount must be greater than 0.000001.");
					return;
				}

				var pthis = this;

				elaMsg.sendMessage(currentName, receiver, "", this.cmd, message, amount, entryURL).then (function(url) {
					console.log(url);
					$('#sendMessageDialog').modal("hide");
					window.location.href = url;
				})
			}
		},
		created () {
		}
	});
	$('#sendMessageDialog').on('show.bs.modal', function (e) {
		var button = e.relatedTarget;
  		var target = button.dataset['whatever'];
  		var cryptoname = button.dataset['cryptoname'];
  		var cmd = button.dataset['cmd'];

  		$("#message-text").val("");

  		if (target.indexOf("replyTo") == 0) {
  			sendMessageDialog.quote = $(e.relatedTarget).find("p.mb-1").text();
  			sendMessageDialog.cmd = cmd;
  			sendMessageDialog.recipient = cryptoname;
  			$("#receiver-name").val(cryptoname);
			if (sendMessageDialog.recipient.length > 0) sendMessageDialog.checkRecipient();	
  		}
  		else if (target.indexOf("newMessage") >= 0) {
  			sendMessageDialog.quote = "";
  			sendMessageDialog.cmd = cmd;
  			sendMessageDialog.recipient = "";
  			$("#receiver-name").val("");
  		}
  		else if (target.indexOf("postMessage") >= 0) {
  			sendMessageDialog.quote = "";
  			sendMessageDialog.cmd = cmd;
  			sendMessageDialog.recipient = cryptoname;
  			$("#receiver-name").val(cryptoname);
			if (sendMessageDialog.recipient.length > 0) sendMessageDialog.checkRecipient();	
  		}
	});

})
