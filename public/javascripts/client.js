$(function () {
    var pubkeyText = $("#pubkey").text();
    if (window.crypto.getRandomValues) {
        openpgp.init();
        var pubkey = openpgp.read_publicKey(pubkeyText);
        var encode = function () {
            var message = "From: " + $("#from").val() + "\n";
            message += "Reply To: " + $("#reply").val() + "\n";
            message += "Subject: " + $("#subject").val() + "\n";
            message += $("#cleartext").val();
            var cyphertext = openpgp.write_encrypted_message(pubkey, message);
            $("#cyphertext").html(cyphertext);
            $("#results").show();
            return cyphertext;
        };
        $(["#from","#reply","#subject","#cleartext"]).each(function(idx,el) 
        {
            $(el).on("keyup",encode);
        });
        $("#submit").on("click", function(ev)
        {
            ev.preventDefault();
            $("#status").html("Sending Message.").addClass("alert-info").show();
            var encoded = encode();
            jQuery.post("/messages",{data:encoded},function(data)
            {
                console.log(data);
                // Verify returned data
                if (data == encoded) 
                {
                    $("#status").html("Message sent and verified.").removeClass("alert-info").addClass("alert-success").show();
                } else 
                {
                    $("#status").html("Message sent, but verification failed.").removeClass("alert-info").addClass("alert-error").show();
                }
                // Give option to view sent message
                // Clear form
                $("#form").reset();
            }).fail(function()
            {
                $("#status").html("Failed to send message. Please refresh the page and try again.").removeClass("alert-info").addClass("alert-error").show();
            });
        });
    }
});