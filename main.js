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
		window.open(url);		
	}

	let params = new URLSearchParams(document.location.search.substring(1));
	var identityData = params.get("Data");
	var currentDID = params.get("did");;
	var currentName = params.get("name");//"songsjun";
	var currentAddress = params.get("address");//"songsjun";


	if (identityData) {
		// To do
		var identity = JSON.parse(identityData);
		var sign = params.get("Sign");

		if ( verify(identityData, sign, identity.PublicKey) && identity.RandomNumber == getProfile("random") ) {
			currentDID = identity.DID;
			currentAddress = identity.ELAAddress;
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
					var myName = this.myName;

					var owner = await elaMsg._getOwner(myName);
					var nameInfo = await elaMsg._getNameInfo(myName);

					if (elaMsg._verifyMessagerName(nameInfo, owner)) {
						alert("Set name successfully!");
						currentName = myName;
						setProfile(currentDID+"_currentName", currentName);
						$("#settingNameDialog").modal("hide");
						window.location.href = window.location.href.split('?')[0];
					}
					else {
						alert("Failed to set name!");
						$("#settingNameDialog").modal("hide");
					}

				}
			},
			created () {

			}
		});


		$("#settingNameDialog").modal("show");

	}
	else if (!currentName || !currentAddress) {
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
	window.currentAddress = currentName;
	window.returnURL = window.location.href.split('?')[0];

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
			"following": {"elastos":[], "elaphant":[], "bbs":[]}
		},
		methods: {

		},
		created () {
			var pthis = this;

			var myFollowing = getProfile(currentDID+"_following");
			if (myFollowing) {
				var temps = JSON.parse(myFollowing);
				for (var item of temps) {
					this.following.push({item:[]});
				}
			}

			for (var key in this.following) {
				(async function() {
					var target = key;
					var address = await elaMsg._getKeyOfName(target, "ela.address");
					var result = await elaMsg.getMyMessages(address, "WAL", target, 0, 100);
					pthis.following[target] = result;
				})();
			}
		}
	});

	window.personalMessage = new Vue({
		el:"#personalMessage",
		data: {
			"messages": {}
		},
		methods: {
		},
		created () {
			var pthis = this;
			elaMsg.getMyMessages(currentAddress, "MSG", currentName, 0, 100).then(function(data) {
				pthis.messages = groupBy(data, currentName);
			})
		}
	});

	window.cryptoNameListView = new Vue({
		el:"#cryptoNameListView",
		data: {
			messages:[]
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

  			cryptoNameListView.messages = personalMessage.messages;
  		}
  		else if (target.indexOf("channel") >= 0) {
  			
  			cryptoNameListView.messages = messageWall.following;
  		}

	});

	window.messagesListView = new Vue({
		el:"#messagesListView",
		data: {
			messages:[]
		},
		methods: {

		},
		created () {

		}
	});
	$('#messagesListView').on('show.bs.modal', function (e) {
		var button = $(e.relatedTarget);
  		var target = button.data('whatever');

  		if (target.indexOf("messages") == 0) {

  			var name = $(e.relatedTarget).find(".mb-1").text();

  			messagesListView.messages = personalMessage.messages[name.substring(1)];
  		}
  		else if (target.indexOf("channel") >= 0) {
  			
  		}
	});

	window.newSubscriptionDialog = new Vue({
		el:"#newSubscriptionDialog",
		data: {
			"subscriptionName":""
		},
		methods: {
			save() {
				var subscription = this.subscriptionName;

				messageWall.following.push({subscription:[]});

				var myFollowing = getProfile(currentDID+"_following");
				var temps = JSON.parse(myFollowing);
				temps.push(subscription);
				setProfile(currentDID+"_following", JSON.stringly(temps));

				elaMsg._getKeyOfName(subscription, "ela.address").then(function(address) {
					return elaMsg.getMyMessages(address, "WAL", subscription, 0, 100);
				}).then(function(result) {
					messageWall.following[subscription] = result;
				});
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
			"quote":"",
			"recipient":"",
			"messageBody": "",
			"recipientChecked": 0,
			"amount":0.000001
		},
		methods: {
			async checkRecipient() {
				var receiver = this.recipient; 

				var bForce = false;

				do {
					var nameInfo = await elaMsg._getNameInfo(receiver, bForce);
					var owner = await elaMsg._getOwner(receiver, bForce);
					if (elaMsg._verifyMessagerName(nameInfo, owner)) {
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
				var receiver = this.recipient;
				var message = this.messageBody;
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

				elaMsg.sendMessage(currentName, receiver, "","MSG", message, amount).then (function(url) {
					console.log(url);
					$('#sendMessageDialog').modal("hide");
					window.open(url, '_blank');
				})
			}
		},
		created () {

		}
	});
	$('#sendMessageDialog').on('show.bs.modal', function (e) {
		var button = $(e.relatedTarget);
  		var target = button.data('whatever');

  		$("#message-text").val("");

  		if (target.indexOf("replyTo") == 0) {
  			sendMessageDialog.quote = $(e.relatedTarget).find("p.mb-1").text();
  			var tmp = $(e.relatedTarget).find("h5.mb-1").text();
  			sendMessageDialog.recipient = tmp.substring(tmp.indexOf("@")+1);  			
  		}
  		else if (target.indexOf("newMessage") >= 0) {
  			sendMessageDialog.recipient = "";
  			sendMessageDialog.quote = "";

  		}
  		else if (target.indexOf("postMessage") >= 0) {
  				
  		}

	});

    // window.app = new Vue({
    //     el: '#main',
    //     data: {
    //     },
    //     methods: {
    //     },
    //     created() {
    //     }
    // })

})
