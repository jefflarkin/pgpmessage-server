$(function () {
    var pubkeyText = $("#pubkey").val();
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
            jQuery.post("/messages",{data:encode()},function(data)
            {
                console.log(data);
            });
        });
    }
});