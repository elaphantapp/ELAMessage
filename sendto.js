$(function () {

	window.web3 = new Web3(new Web3.providers.HttpProvider("https://mainrpc.elaeth.io"));
	if (!web3) {
		console.log("Can't init Web3 Provider, please check your network.")
		return;
	}

	window.crypton = new Crypton(abiArray, "0xc4032babad2b76c39abec3c4e365611de78528ed", web3);

	window.elaMsg = new ElaMessage(crypton);

	
	let params = new URLSearchParams(document.location.search.substring(1));
	var receiver = params.get("r");
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
			"amount":0.000001
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

				elaMsg.sendMessage("www", receiver, "", "MSG", message, amount).then (function(url) {
					console.log(url);
					$('#sendMessageDialog').modal("hide");
					window.location.href = url;
				})
			}
		},
		created() {
			this.quote = "You can send a public message to the CryptoName user who enabled Messenger option. This message will be stored on the blockchain, so please pay attention to your personal privacy. The receiver can't reply to you, if you already have a CryptoName, you can install the ELA Message which is an elephant wallet mini app and talk to him.";
		}
	});
});