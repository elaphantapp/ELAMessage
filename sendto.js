$(function () {

	window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainrpc.elaeth.io"));
	if (!web3) {
		console.log("Can't init Web3 Provider, please check your network.")
		return;
	}

	window.crypton = new Crypton(abiArray, "0xc4032babad2b76c39abec3c4e365611de78528ed", web3);

	window.elaMsg = new ElaMessage(crypton);

	
	const url = new URL(window.location.href);
	url.searchParams.delete('OrderID');
	url.searchParams.delete('TXID');
	var entryURL = url.href;

	let params = new URLSearchParams(url.search.substring(1));
	var currentDID = "www";
	var currentName = "www";
	var currentAddress = "www";

	var receiver = params.get("n");
	if (!receiver)
		receiver = "";
	var message = params.get("m");
	if (!message)
		message = "";

	window.sendMessageForm = new Vue({
		el:"#SendToMessage",
		data: {
			"quote":"",
			"recipient": receiver,
			"messageBody": message,
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

				elaMsg.sendMessage("www", receiver, "", "MSG", message, amount, window.location.href).then (function(url) {
					console.log(url);
					window.location.href = url;
				})
			}
		},
		created() {
			this.quote = "Messages will be stored on the blockchain, so please pay attention to your personal privacy. You are currently anonymous, all senders names are "www", and recipients cannot reply to your messages. If you want to talk to another registered CryptoName user, you can by installing the ELA Message mini app inside the Elaphant Wallet.";
			if (this.recipient.length > 0) 
				this.checkRecipient();
		}
	});

});