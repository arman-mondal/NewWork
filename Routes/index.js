const app=require('express').Router()


app.get('/ffollowers', (req, res) => {
    const data = req.query.my_id;
    const sql = `SELECT t1.kisne_kiya, users.Profile_image, users.msgPrivacy, users.Username, users.Role, t2.kisko_kiya 
                  FROM (SELECT * FROM followers WHERE kisko_kiya = ${data}) t1 
                  LEFT OUTER JOIN (SELECT * FROM followers WHERE kisne_kiya = ${data}) t2 
                  ON t1.kisne_kiya = t2.kisko_kiya 
                  INNER JOIN users ON t1.kisne_kiya = users.ID`;
    
    db.query(sql, (err, result) => {
      if (err) {
        res.status(500).json({ error: err.message });
      } else {
        res.json(result);
      }
    });
  });
  
  app.get('/fmutual', (req, res) => {
      const my_id = req.query.my_id;
      if (my_id) {
        const sql = `SELECT t1.kisne_kiya, users.Profile_image, users.Username, users.Role 
                    FROM (SELECT * FROM followers WHERE kisko_kiya = ${my_id}) t1 
                    INNER JOIN (SELECT * FROM followers WHERE kisne_kiya = ${my_id}) t2 
                    ON t1.kisne_kiya = t2.kisko_kiya 
                    INNER JOIN users ON t1.kisne_kiya = users.ID`;
      
        db.query(sql, (err, result) => {
          if (err) {
            res.status(500).json({ error: err.message });
          } else {
            res.json(result);
          }
        });
      } else {
        res.status(400).json({ error: "Missing 'my_id' parameter" });
      }
    });
    app.get('/fmyfollowing', (req, res) => {
      const data = req.query.myid;
      const sql = `SELECT followers.kisne_kiya, users.Username, users.Profile_image AS img, users.Role, users.recomend_pvcy, followers.kisko_kiya 
                    FROM users 
                    INNER JOIN followers ON users.ID = followers.kisko_kiya 
                    WHERE followers.kisne_kiya = ${data} AND users.recomend_pvcy = '0'`;
      
      db.query(sql, (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(result);
        }
      });
    });
    app.post('/login', (req, res) => {
      const { Username, Password } = req.body;
    
      const sql = `SELECT * FROM users WHERE Username = ? AND Password = ?`;
      db.query(sql, [Username, Password], (err, result) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          if (result.length > 0) {
            const { ID, Role, M_type, m_enddate, Register_as } = result[0];
            const responseData = {
              result: 'Success',
              id: ID,
              role: Role,
              member: M_type,
              m_enddate: m_enddate,
              Register_as: Register_as
            };
            res.json(responseData);
          } else {
            res.status(404).json({ error: 'Error' });
          }
        }
      });
    });
    app.post('/register', (req, res) => {
      const { First_Name, Last_Name, Email, Password, Phone_Number, Register_as, Role, Username, otp } = req.body;
    
      if (First_Name && Last_Name && Email && Password && Phone_Number && Register_as && Role && Username && otp) {
        const checkQuery = `SELECT * FROM users WHERE Email = '${Email}' OR Username = '${Username}' OR Phone_Number = '${Phone_Number}'`;
        db.query(checkQuery, (err, checkResult) => {
          if (err) {
            res.status(500).json({ status: 'error', message: err.message });
          } else {
            if (checkResult.length > 0) {
              res.status(400).json({ status: 'error', message: 'Email, username, or phone number already exists.' });
            } else {
              const otpVerificationQuery = `SELECT * FROM otp_verifications WHERE email = '${Email}' AND otp = '${otp}' AND verification_status = 0`;
              db.query(otpVerificationQuery, (otpErr, otpResult) => {
                if (otpErr) {
                  res.status(500).json({ status: 'error', message: otpErr.message });
                } else {
                  if (otpResult.length > 0) {
                    const updateOtpQuery = `UPDATE otp_verifications SET verification_status = 1 WHERE email = '${Email}' AND otp = '${otp}'`;
                    db.query(updateOtpQuery, (updateErr, updateResult) => {
                      if (updateErr) {
                        res.status(500).json({ status: 'error', message: updateErr.message });
                      } else {
                        const insertUserQuery = `INSERT INTO users (First_Name, Last_Name, Email, Password, Phone_Number, Register_as, Role, Username) 
                          VALUES ('${First_Name}', '${Last_Name}', '${Email}', '${Password}', '${Phone_Number}', '${Register_as}', '${Role}', '${Username}')`;
                        db.query(insertUserQuery, (insertErr, insertResult) => {
                          if (insertErr) {
                            res.status(500).json({ status: 'error', message: insertErr.message });
                          } else {
                            const user_id = insertResult.insertId;
                            const responseData = {
                              status: 'success',
                              message: 'User inserted successfully.',
                              user_data: {
                                id: user_id,
                                First_Name,
                                Last_Name,
                                Email,
                                Phone_Number,
                                Register_as,
                                Role,
                                Username
                              }
                            };
                            res.json(responseData);
                          }
                        });
                      }
                    });
                  } else {
                    res.status(400).json({ status: 'error', message: 'Wrong OTP.' });
                  }
                }
              });
            }
          }
        });
      } else {
        res.status(400).json({ status: 'error', message: 'Missing parameters.' });
      }
    });

module.exports=app;