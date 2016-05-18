var passwordHash = require('password-hash');
var MongoClient = require('mongodb').MongoClient;

MongoClient.connect('mongodb://localhost:27017/linkio', function (err, db) {
	var nbUpdate = 0;
	db.collection('user').find().each(function(err, user) {
		if(user != null && !passwordHash.isHashed(user.password)) {
			db.collection('user').updateOne({_id: user._id}, {
				$set: {
					password: passwordHash.generate(user.password),
					token: generateToken()
				}
			});
			nbUpdate++;
		}
		else {
			console.log("End. Total update: " + nbUpdate);
			process.exit();
		}
	});
});

function generateToken() {
	return Math.random().toString(36).substring(2, 18).toUpperCase();
}