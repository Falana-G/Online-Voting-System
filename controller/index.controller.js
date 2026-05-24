const connection = require('../db/config');
let indexController = {};

const jwt = require("jsonwebtoken");
const secret = '123abc!@#';


// LOGIN CHECK
indexController.loginCheck = (req, res) => {

    let adhaar = req.body.adhaar;
    let password = req.body.password;

    let values = [adhaar, password];

    let Checkquery = "SELECT * FROM user WHERE adhaar=? AND password=?";

    connection.query(Checkquery, values, (err, records) => {

        if (err) {
            return res.send(err.message);
        }

        if(records.length == 0){

            return res.send("Invalid Adhaar or Password");

        }
        else{

            const payload = {
                adhaar: records[0].adhaar,
                password: records[0].password,
            }

            const token = jwt.sign(payload, secret, {expiresIn: '15m'});

            let date = new Date();
            date.setHours(date.getHours() + 2);

            res.cookie('userToken', token, {expires: date});
            return res.json({ error: false, message: "Login Successful! Redirecting..." });

        }

    });

}



// CREATE USER
indexController.createUser = (req, res) => {

    let adhaar = req.body.adhaar;
    let password = req.body.password;

    let checkquery = "SELECT * FROM user WHERE adhaar=?";

    connection.query(checkquery, [adhaar], (error, records) => {

        if (error) {
            res.json({error: true, message: error.message});
        }

        if(records.length == 0){

            let insertquery = 'INSERT INTO user (adhaar, password) VALUES (?, ?)';

            let values = [adhaar, password];

            connection.query(insertquery, values, (error) => {

                if (error) {
                    res.json({error: true, message: error.message});
                }

                return res.json({error: false, message: "Registration Successful! Redirecting...", redirect: '/login'});

            });

        }
        else{

            res.json({error: true, message: "User Already exists!"});

        }

    });

}



// ADMIN CHECK
indexController.adminCheck = (req, res) => {

    let adhaar = req.body.adhaar;
    let password = req.body.password;

    let values = [adhaar, password];

    let Checkquery = "SELECT * FROM admin WHERE adhaar=? AND password=?";

    connection.query(Checkquery, values, (err, records) => {

        if (err) {
            return res.send(err.message);
        }

        if(records.length == 0){

            return res.send("Invalid Adhaar or Password");

        }
        else{

            const payload = {
                adhaar: records[0].adhaar,
                password: records[0].password,
            }

            const token = jwt.sign(payload, secret, {expiresIn: '15m'});

            let date = new Date();
            date.setHours(date.getHours() + 2);

            res.cookie('adminToken', token, {expires: date});
            return res.json({ error: false, message: "Login Successful! Redirecting..." });

        }

    });

}



// ADD CANDIDATE
indexController.addRecord = (req, res) => {
    let adhaar = req.body.adhaar;
    let name = req.body.name;
    let party = req.body.party;

    let checkquery = "SELECT * FROM candidates WHERE adhaar=?";

    connection.query(checkquery, [adhaar], (error, records) => {
        if (error) {
            return res.json({error: true, message: error.message});
        }

        if(records.length == 0){
            let insertquery = 'INSERT INTO candidates (adhaar, name, party) VALUES (?, ?, ?)';
            let values = [adhaar, name, party];

            connection.query(insertquery, values, (error) => {
                if (error) {
                    return res.json({error: true, message: error.message});
                }
                return res.json({error: false, message: "Candidate Added Successfully!"});
            }); //
        }
        else{
            return res.json({error: true, message: "Candidate Already exists!"});
        }
    });
}



// READ RECORDS
indexController.readRecords = (req, res) => {
    let selectQuery = "SELECT * FROM candidates";
    connection.query(selectQuery, (error, records) => {
        if (error) {
            return res.json({ error: true, message: error.message, records: [] });
        } else {
            return res.json({ error: false, message: "Data fetched successfully", records: records });
        }
    });
}


// ADMIN VOTING STATUS
indexController.adminVotingStatus = (req, res) => {
    let query = "SELECT voting_status FROM settings WHERE id=1";
    connection.query(query, (error, records) => {
        if (error) {
            return res.json({error: true, message: error.message});
        }

        let systemStatus = records[0].voting_status;
        return res.json({error: true, systemStatus: systemStatus});
    })
}

// GET VOTING STATUS
indexController.getVotingStatus = (req, res) => {
    let systemQuery = "SELECT voting_status FROM settings WHERE id = 1";

    connection.query(systemQuery, (err, settingsRecords) => {
        if (err) return res.json({ error: true, message: err.message });

        let systemStatus = settingsRecords.length > 0 ? settingsRecords[0].voting_status : 0;

        // 2. Ab check karo jo user login hai, uska 'has_voted' status kya hai
        // (AuthenticationUser middleware se req.userData me logged-in user ka adhaar mil jayega)
        let userAdhaar = req.userData.adhaar;

        if (!userAdhaar) {
            return res.json({ error: false, status: systemStatus, hasVoted: 0 });
        }

        let userQuery = "SELECT has_voted FROM user WHERE adhaar = ?";
        connection.query(userQuery, [userAdhaar], (err, userRecords) => {
            if (err) return res.json({ error: true, message: err.message });

            let hasVoted = userRecords[0].has_voted;

            return res.json({
                error: false,
                status: systemStatus,
                hasVoted: hasVoted
            });
        });
    })
}

// START VOTING
indexController.startVoting = (req, res) => {
    let votequery = 'UPDATE candidates SET votes = 0';
    connection.query(votequery, (error) => {
        if (error) {
            return res.json({ error: true, message: error.message });
        }

        let hasquery = 'UPDATE user SET has_voted = 0';
        connection.query(hasquery, (error) => {
            if (error) {
                return res.json({ error: true, message: error.message });
            }

            let query = "UPDATE settings SET voting_status = 1 WHERE id = 1";
            connection.query(query, (err) => {
                if (err) return res.json({ error: true, message: err.message });
                return res.json({ error: false, message: "Voting Started Successfully!" });
            });
        })

    })
};

// END VOTING
indexController.endVoting = (req, res) => {
    let query = "UPDATE settings SET voting_status = 0 WHERE id = 1";
    connection.query(query, (err) => {
        if (err) return res.json({ error: true, message: err.message });
        return res.json({ error: false, message: "Voting Stopped Successfully!" });
    });
};



indexController.voting = (req, res) => {
    let adhaar = req.body.adhaar;
    let updateQuery = "UPDATE candidates SET votes = votes + 1 WHERE adhaar = ?";
    connection.query(updateQuery, [adhaar], function(error){
        if(error){
            return res.json({error:true, message: error.message});
        }else{
            let userAdhaar = req.userData.adhaar;
            let hasQuery = "UPDATE user SET has_voted = 1 WHERE adhaar = ?";
            connection.query(hasQuery, [userAdhaar], (error)=>{
                if(error){
                    return res.json({error:true, message: error.message});
                }else{
                    return res.json({error:false, message: "Vote casted"});
                }
            })
        }
    })
}


module.exports = indexController;