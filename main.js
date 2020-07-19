$(function () {

	PullToRefresh.init({
        mainElement: 'body',
        onRefresh: function() { alert('refresh') }
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

	let params = new URLSearchParams(document.location.search.substring(1));
	window.currentName = params.get("name");//"songsjun";
	window.currentAddress = params.get("address");//"songsjun";

	// await Crypton.QueryKey(currentName, "ela.address");
	// Crypton.QueryKey(currentName, "ela.address").then(function(addr) {
	// 	window.currentAddress = addr;	
	// });

	window.groupBy = function(xs, myname) {
		var ret = {};
		for (var x of xs) {
	  		var key = myname == x['f'] ? "t" : "f";
	    	(ret[x[key]] = ret[x[key]] || []).push(x);
		}
		return ret;
	};




	// elaMsg.sendMessage("songsjun", "zzz", "","MSG", "你好 "+(new Date()).toLocaleString(), "0.00000001").then (function(url) {
	// 	//window.open(url, '_blank');
	// 	console.log(url);
	// }).then(function() {
	// 	Crypton.QueryKey("songsjun", "ela.address").then (function(address) {
	// 		elaMsg.getMyMessages(address, "MSG", "zzz", 0, 2).then(function(ret) {
	// 			for(var item of ret) {
	// 				console.log(item);
	// 			}
	// 		});

	// 	})
	// });

	window.messageWall = new Vue({
		el:"#messageWall",
		data: {

		},
		methods: {

		},
		created () {

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

		},
		methods: {

		},
		created () {

		}
	});
	$('#cryptoNameListView').on('show.bs.modal', function (e) {

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
  		else if (target.indexOf("channel:") >= 0) {
  			
  		}
	});

	window.newSubscriptionDialog = new Vue({
		el:"#newSubscriptionDialog",
		data: {

		},
		methods: {

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
			"recipient":""
		},
		methods: {
			sendMessage() {
				var receiver = $("#receiver-name").val() || this.recipient; 
				var message = $("#message-text").val();
				var amount = $("#send-amount").val();

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
