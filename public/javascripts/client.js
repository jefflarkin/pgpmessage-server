$(function () {
    var pubkeyText = $("#pubkey").text();
    if (window.crypto.getRandomValues) {
        var openpgp = window.openpgp;
        var pubkey = openpgp.key.readArmored(pubkeyText);
        var encode = function () {
            var message = "From: " + $("#from").val() + "\n";
            message += "Reply To: " + $("#reply").val() + "\n";
            message += "KeyID: " + $("#keyid").val() + "\n";
            message += "Subject: " + $("#subject").val() + "\n";
            message += $("#cleartext").val();
            var cyphertext = openpgp.encryptMessage(pubkey.keys, message);
            $("#cyphertext").html(cyphertext);
            $("#results").show();
            return cyphertext;
        };
        /*$(["#from","#reply","#subject","#cleartext"]).each(function(idx,el) 
        {
            $(el).on("keyup",encode);
        });*/
        $("#submit").on("click", function(ev)
        {
            ev.preventDefault();
            if ($("#cleartext").val() === "") 
            {
                $("#status").html("Message Required").addClass("alert-info").show();
                return false;
            }
            $("#status").html("Sending Message.").addClass("alert-info").show();
            var encoded = encode();
            jQuery.post("/messages",{message:encoded},function(data)
            {
                // Verify returned data
                if (data == encoded) 
                {
                    $("#status").html("Message sent and verified.").removeClass("alert-info").addClass("alert-success").show();
                } else 
                {
                    $("#status").html("Message sent, but verification failed.").removeClass("alert-info").addClass("alert-danger").show();
                }
                // Give option to view sent message
                // Clear form
                $("#form").find("input[type=text], textarea").val("");
            }).fail(function(jq)
            {
                if(jq.statusCode().status == 403)
                {
                    $("#status").html("Message rejected by the server. " + jq.responseText).removeClass("alert-info").addClass("alert-danger").show();
                } else
                {
                  $("#status").html("Failed to send message. Please refresh the page and try again.").removeClass("alert-info").addClass("alert-danger").show();
                }
            });
        });
    }
});