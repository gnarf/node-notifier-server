var mailer = require("nodemailer");
var config = require("./mail-config.json");
module.exports = function( subject, body, callback ) {
	var transport = mailer.createTransport( "SMTP", config.transport );
	transport.sendMail({
		from: config.mail.from,
		to: config.mail.to,
		subject: subject,
		text: body
	}, function( error, response ) {
		(callback || function(){}).apply( this, arguments );
		transport.close();
	});
};
