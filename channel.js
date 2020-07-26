$(function () {

	PullToRefresh.init({
        mainElement: 'body',
        onRefresh: function() { 
        	window.location.href = window.location.href;
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
		var url = "https://launch.elaphant.app/?appName=ELAMessage&appTitle=ELAMessage&autoRedirect=True&redirectURL=elaphant%3A%2F%2Fidentity%3FAppID%3Dac89a6a3ff8165411c8426529dccde5cd44d5041407bf249b57ae99a6bfeadd60f74409bd5a3d81979805806606dd2d55f6979ca467982583ac734cf6f55a290%26AppName%3DMini%20Apps%26RandomNumber%3D"+random+"%26DID%3DibxNTG1hBPK1rZuoc8fMy4eFQ96UYDAQ4J%26PublicKey%3D034c51ddc0844ff11397cc773a5b7d94d5eed05e7006fb229cf965b47f19d27c55%26ReturnUrl%3Dhttps%253A%252F%252Felamessage.elaphant.app%26RequestInfo%3DELAAddress%2CBTCAddress%2CETHAddress"
		window.location.href = url;		
	}

	const url = new URL(window.location.href);
	url.searchParams.delete('OrderID');
	url.searchParams.delete('TXID');
	var entryURL = url.href;

	let params = new URLSearchParams(url.search.substring(1));

	var cryptoname = params.get("n");
	window.currentDID = "www";
	window.currentName = "www";
	window.currentAddress = "www";

	$("#messageWallTitle").html("<b>"+cryptoname+"</b>");

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


	window.messagesListView = new Vue({
		el:"#messagesListView",
		data: {
			"cryptoname": cryptoname,
			"type":"Post",
			"cmd":"WAL",
			"messages":[],
			"keyword":""
		},
		methods: {
		},
		created () {
			var pthis = this;

			elaMsg._getKeyOfName(cryptoname, "ela.address", true).then (function(address) {
				if (address.length < 34 )
					return;
				return elaMsg.getMyMessages(address, "WAL", cryptoname, 0, 1000);
			}).then (function(result) {
				if (result && result.length > 0) {
					pthis.messages = result;
				}
			}).catch (err => {
				console.log(err);
			});

		}
	});
	$('#messagesListView').on('show.bs.modal', function (e) {
	});


	window.sendMessageForm = new Vue({
		el:"#sendMessageDialog",
		data: {
			"quote":"",
			"recipient": cryptoname,
			"messageBody": "",
			"recipientChecked": 0,
			"amount":0.01
		},
		methods: {
			async checkRecipient() {
				var receiver = this.recipient.trim().toLowerCase(); 

				var bForce = false;
				this.recipientChecked = 0;
				try {
					do {
						var nameInfo = await elaMsg._getNameInfo(cryptoname, bForce);
						var owner = await elaMsg._getOwner(cryptoname, bForce);
						if (elaMsg._verifyMessagerName(nameInfo, owner)) {
							this.recipientChecked = 1;
							$("#receiver-name").css("color", "green").css("border-color", "green");
							return;
						}
						else {
							bForce = !bForce;
						}
					} while(bForce);
				} catch (err) {
					console.log(err);
				}

				this.recipientChecked = -1;
				$("#receiver-name").css("color", "red").css("border-color", "red");
			},
			sendMessage () {
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

				elaMsg.sendMessage("www", receiver, "", "WAL", message, amount, window.location.href).then (function(url) {
					console.log(url);
					$('#sendMessageDialog').modal("hide");
					window.location.href = url;
				})
			}
		},
		created() {
			this.quote = "Message's will be stored on the blockchain, so please pay attention to your personal privacy. If you want to talk to another registered CryptoName user, you can by installing the ELA Message mini app inside the Elaphant Wallet.";
		}
	});	
	$('#sendMessageDialog').on('show.bs.modal', function (e) {
		if (sendMessageForm.recipient.length > 0) 
			sendMessageForm.checkRecipient();
	});




})
