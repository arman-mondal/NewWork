const app=require('express').Router()
const mysql = require('mysql2');
const path=require('path')
const multer = require('multer');

const db=require('../Config/Database')


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
    app.post('/updateAuditionApplication', (req, res) => {
      const { uid, status, M_dateandtime, E_dateandtime, meeting_link, meeting_status } = req.body;
    
      if (uid) {
        const sql = `UPDATE Audition_Applications 
                     SET status=?, M_dateandtime=?, E_dateandtime=?, meeting_link=?, meeting_status=? 
                     WHERE id=?`;
        const values = [status, M_dateandtime, E_dateandtime, meeting_link, meeting_status, uid];
    
        db.query(sql, values, (err, result) => {
          if (err) {
            res.status(500).json({ status: false, message: 'Update Error' });
          } else {
            res.json({ status: true, message: 'Updated Successfully' });
          }
        });
      } else {
        res.status(400).json({ status: false, message: 'Missing parameters' });
      }
    });

    app.post('/verifyOTP', (req, res) => {
      const { emailid, otp } = req.body;
    
      if (emailid && otp) {
        const sql = `SELECT * FROM users WHERE email = ?`;
        db.query(sql, emailid, (err, result) => {
          if (err) {
            res.status(500).json({ status: 'failed', message: 'Database error' });
          } else {
            if (result.length > 0) {
              const sql2 = `SELECT * FROM otp_verifications WHERE email = ? AND otp = ? AND verification_status = 0`;
              db.query(sql2, [emailid, otp], (err2, result2) => {
                if (err2) {
                  res.status(500).json({ status: 'failed', message: 'Database error' });
                } else {
                  if (result2.length > 0) {
                    const sql3 = `UPDATE otp_verifications SET verification_status = 1 WHERE email = ? AND otp = ?`;
                    db.query(sql3, [emailid, otp], (err3, result3) => {
                      if (err3) {
                        res.status(500).json({ status: 'failed', message: 'Database error' });
                      } else {
                        res.json({ status: 'success', message: 'OTP verified.' });
                      }
                    });
                  } else {
                    res.json({ status: 'failed', message: 'No matching unverified OTP found.' });
                  }
                }
              });
            } else {
              res.json({ status: 'failed', message: 'Email does not exist.' });
            }
          }
        });
      } else {
        res.status(400).json({ status: 'failed', message: 'Missing parameters.' });
      }
    });
    const storage = multer.diskStorage({
      destination: function (req, file, cb) {
        cb(null, 'uploads/');
      },
      filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now() + path.extname(file.originalname));
      }
    });
    
    const upload = multer({ storage: storage });
    
    // POST endpoint to handle file uploads
    app.post('/uploadProject', upload.single('file'), (req, res) => {
      const { userid, title, status, username } = req.body;
      const filename = req.file ? req.file.filename : '';
    
      if (!title) {
        res.status(400).json({ message: 'Title is required' });
        return;
      }
    
      const sql = "INSERT INTO my_projectlist (project_banner, userid, title, status, username) VALUES (?, ?, ?, ?, ?)";
      const values = [filename, userid, title, status, username];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Database error' });
        } else {
          res.status(200).json({ status: 'success', message: 'Uploaded successfully' });
        }
      });
    });
    
    // POST endpoint for non-file uploads
    app.post('/uploadProjectNoFile', (req, res) => {
      const { userid, title, status, username } = req.body;
    
      if (!title) {
        res.status(400).json({ message: 'Title is required' });
        return;
      }
    
      const sql = "INSERT INTO my_projectlist (userid, title, status, username) VALUES (?, ?, ?, ?)";
      const values = [userid, title, status, username];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Database error' });
        } else {
          res.status(200).json({ status: 'success', message: 'Uploaded successfully' });
        }
      });
    });  
    
    app.post('/uploadPost', upload.single('file'), (req, res) => {
      const { userid, username, Dsc, YTurl, filetype } = req.body;
      const filename = req.file ? req.file.filename : '';
    
      if (!Dsc) {
        res.status(400).json({ message: 'Description is required' });
        return;
      }
    
      const sql = "INSERT INTO createpost (filename, Dsc, YTurl, userid, username, filetype) VALUES (?, ?, ?, ?, ?, ?)";
      const values = [filename, Dsc, YTurl, userid, username, filetype];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Database error' });
        } else {
          res.status(200).json({ status: 'success', message: 'Uploaded successfully' });
        }
      });
    });
    
    // POST endpoint for non-file uploads
    app.post('/uploadPostNoFile', (req, res) => {
      const { userid, username, Dsc, YTurl, filetype } = req.body;
    
      if (!Dsc) {
        res.status(400).json({ message: 'Description is required' });
        return;
      }
    
      const sql = "INSERT INTO createpost (Dsc, YTurl, userid, username, filetype) VALUES (?, ?, ?, ?, ?)";
      const values = [Dsc, YTurl, userid, username, filetype];
    
      db.query(sql, values, (err, result) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Database error' });
        } else {
          res.status(200).json({ status: 'success', message: 'Uploaded successfully' });
        }
      });
    });
    app.delete('/deletePostAudition/:id', (req, res) => {
      const id = req.params.id;
    
      const sql = "DELETE FROM Post_Audition WHERE id = ?";
      db.query(sql, id, (err, result) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Database error' });
        } else {
          if (result.affectedRows > 0) {
            res.status(200).json({ status: 'success', message: 'Deleted successfully' });
          } else {
            res.status(404).json({ status: 'error', message: 'Post not found' });
          }
        }
      });
    });
    app.post('/deletePost', (req, res) => {
      const { post_id } = req.body;
    
      // Check if post_id is provided
      if (!post_id) {
        return res.status(400).json({ message: 'post_id is required' });
      }
    
      // Delete post from database
      const sql = "DELETE FROM post WHERE userid = ?";
      db.query(sql, [post_id], (err, result) => {
        if (err) {
          console.error(err);
          return res.status(500).json({ message: 'Internal server error' });
        }
        
        // Check if any rows were affected (post deleted)
        if (result.affectedRows > 0) {
          return res.status(200).json({ message: 'Data delete is successful', status: 200 });
        } else {
          return res.status(404).json({ message: 'No post found with the provided ID', status: 404 });
        }
      });
    });
    app.delete('/deleteProject/:id', (req, res) => {
      const id = req.params.id;
    
      const sql = "DELETE FROM my_projectlist WHERE id = ?";
      db.query(sql, id, (err, result) => {
        if (err) {
          res.status(500).json({ status: 'error', message: 'Database error' });
        } else {
          if (result.affectedRows > 0) {
            res.status(200).json({ status: 'success', message: 'Deleted successfully' });
          } else {
            res.status(404).json({ status: 'error', message: 'Record not found' });
          }
        }
      });
    });
    app.get('/getMaleUsers', (req, res) => {
      const sql = "SELECT * FROM users WHERE Gender = 'Male'";
      db.query(sql, (err, results) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(results);
        }
      });
    });
    app.get('/recommendations/:id', (req, res) => {
      const data = req.params.id;
      const sql = `SELECT T1.id, T1.meri_id, T1.recomend_to_id, T1.recomended_id, T3.Username AS u1, T3.Profile_image AS p1dp, T4.Profile_image AS p2dp, T4.Username AS u2  
                   FROM recommendation T1
                   INNER JOIN users T2 ON T1.recomend_to_id = T2.ID AND T1.recomended_id = 63
                   INNER JOIN users T3 ON T3.ID = T1.meri_id
                   LEFT JOIN users T4 ON T4.ID = T1.recomend_to_id`;
    
      db.query(sql, (err, results) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(results);
        }
      });
    });
    app.get('/auditionApplications', (req, res) => {
      const name = req.query.Username;
      const sql = `SELECT * FROM Audition_Applications
                   INNER JOIN users ON Audition_Applications.applicant = users.ID
                   WHERE users.Username LIKE '%${name}%'`;
    
      db.query(sql, (err, results) => {
        if (err) {
          res.status(500).json({ error: err.message });
        } else {
          res.json(results);
        }
      });
    });
    
    
module.exports=app;