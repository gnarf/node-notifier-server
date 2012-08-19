var root = require( "path" ).dirname( __filename ),
	directory = root + "/notifier.d",

	opts = require( "optimist" )
		.usage( "Start a server to listen for github post receives and execute scripts from a directory\n\t$0" )
		.options( "p", {
			alias: "port",
			default: 3333,
			describe: "Port number for server"
		})
		.options( "d", {
			alias: "directory",
			default: directory,
		})
		.boolean( "console" )
		.describe( "console", "Log to console instead of syslog" );
	argv = opts.argv,
	port = argv.p,
	server = require( "git-notifier" ).createServer(),
	fs = require( "fs" ),
	proc = require( "child_process" ),
	logger = require( "logger" ).init( "notifier-server" );

directory = argv.d;

if ( argv.h ) {
	console.log( opts.help() );
	process.exit();
}

function makeExec( filename ) {

	function doLog( method, prefix, text ) {
		var parts = ("" + text).split(/\n/);
		parts.forEach(function( line ) {
			logger[ method ]( prefix + line );
		});
	}

	return function( data ) {
		logger.log( "spawn: ", filename, data.commit );
		proc.exec( directory + "/" + filename + " " + data.commit, function( error, stdout, stderr ) {
			if ( stdout ) {
				doLog( "log", filename + ":out:", stdout );
			}
			if ( stderr ) {
				doLog( "log", filename + ":err:", stderr );
			}
			if ( error ) {
				doLog( "error", filename + ":error:", error );
			}
		});
	}
}

fs.readdirSync( directory ).forEach( function( file ) {
	if ( !/\.js$/.exec( file ) ) {
		return;
	}
	logger.log( "Including " + directory + "/" + file );
	var js = directory + "/" + file,
		sh = file.replace( /\.js$/, ".sh" );
	require( js )( server, makeExec( sh ) );
});

server.on( "error", function ( err ) {
	logger.error( "Error:", err );
});

logger.log( "Setting up post-receive server on port", port );
server.listen( port );
