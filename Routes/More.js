
const express = require('express').Router();
const multer = require('multer');
const fs = require('fs');
const db=require('../Config/Database')
const app=require('express').Router();
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'uploads/');
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname);
    }
  });
  const upload = multer({ storage: storage });

  app.post('/updatePostAudition', upload.single('file'), (req, res) => {
    const { auid, Title, Registration_sd, Registration_ed, Audition_sd, Audition_ed, Venue, Description } = req.body;
    const targetFile = req.file ? req.file.originalname : null;
  
    let sql;
    let params;
  
    if (targetFile) {
      sql = `UPDATE Post_Audition 
             SET Title = ?, Registration_sd = ?, Registration_ed = ?, Audition_sd = ?, Audition_ed = ?, Image = ?, Venue = ?, Description = ? 
             WHERE id = ?`;
      params = [Title, Registration_sd, Registration_ed, Audition_sd, Audition_ed, targetFile, Venue, Description, auid];
    } else {
      sql = `UPDATE Post_Audition 
             SET Title = ?, Registration_sd = ?, Registration_ed = ?, Audition_sd = ?, Audition_ed = ?, Venue = ?, Description = ? 
             WHERE id = ?`;
      params = [Title, Registration_sd, Registration_ed, Audition_sd, Audition_ed, Venue, Description, auid];
    }
  
    db.query(sql, params, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Error updating post audition', status: 'false' });
      } else {
        res.json({ message: 'Post audition updated successfully', status: 'true' });
      }
    });
  });


app.post('/uploadPostAudition', upload.single('file'), (req, res) => {
    const { Title, sender_id, Registration_sd, Registration_ed, Audition_sd, Audition_ed, Venue, Description } = req.body;
    const filename = req.file ? req.file.originalname : null;
  
    // Check if file was uploaded successfully
    if (!filename) {
      return res.status(400).json({ message: 'Please upload a file', status: 'false' });
    }
  
    const sql = `INSERT INTO Post_Audition (Image, Title, sender_id, Registration_sd, Registration_ed, Audition_sd, Audition_ed, Venue, Description)
                 VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`;
    const values = [filename, Title, sender_id, Registration_sd, Registration_ed, Audition_sd, Audition_ed, Venue, Description];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error(err);
        res.status(500).json({ message: 'Error uploading post audition', status: 'false' });
      } else {
        res.json({ message: 'Post audition uploaded successfully', status: 'true' });
      }
    });
  });

  app.post('/', (req, res) => {
    const { uid, auid, all, applied } = req.body;
    let query = '';
  
    if (uid) {
      query = `SELECT * FROM Post_Audition WHERE sender_id = '${uid}'`;
    } else if (auid) {
      query = `SELECT * FROM Post_Audition WHERE id = '${auid}'`;
    } else if (all) {
      query = `SELECT Post_Audition.*, Audition_Applications.status 
               FROM Post_Audition 
               LEFT JOIN Audition_Applications ON Post_Audition.id = Audition_Applications.auditionid 
               AND Audition_Applications.applicant = ${all} 
               WHERE Audition_Applications.status IS NULL`;
    } else if (applied) {
      query = `SELECT Post_Audition.*, Audition_Applications.status 
               FROM Post_Audition 
               INNER JOIN Audition_Applications ON Post_Audition.id = Audition_Applications.auditionid 
               AND Audition_Applications.applicant = ${applied}`;
    }
  
    db.query(query, (error, results) => {
      if (error) {
        console.error('Error executing query: ' + error.stack);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      res.json(results);
    });
  });

  app.post('/notification', (req, res) => {
    const { p1, p2, type, notified_to } = req.body;
    let msg = 'notification';
  
    if (type === 'FBO') {
      msg = `${p1username} started following you`;
    } else if (type === 'MF') {
      msg = `Favorited by ${p1username}`;
    } else if (type === 'RTM') {
      msg = `Recommended to me by ${p1username}`;
    } else if (type === 'NM') {
      msg = `New Massage from ${p1username}`;
    }
  
    const insertsql = "INSERT INTO `notification` (`p1`, `p2`, `type`, `notified_to`, `msg`) VALUES (?, ?, ?, ?, ?)";
    const values = [p1, p2, type, notified_to, msg];
  
    // Execute the INSERT query
    db.query(insertsql, values, (err, result) => {
      if (err) {
        console.error('Error executing INSERT query:', err);
        res.status(500).json({ message: 'Error executing query', error: err });
        return;
      }
      console.log('Notification inserted successfully');
      res.json({ message: 'Notification inserted successfully', result });
    });
  });
  const handleRequest = (req, res) => {
    const data = req.query.id; // Assuming data is sent as query parameter
    const arr = [];
  
    const sql = `SELECT T1.id, T1.msg, T1.p1, T1.p2, T1.notified_to, T1.type, T2.Username, T3.Profile_image AS p1dp, T4.Profile_image AS p2dp 
                 FROM notification T1
                 INNER JOIN users T2 ON T1.notified_to = T2.ID AND T1.notified_to = ${data} 
                 INNER JOIN users T3 ON T3.ID = T1.p1 
                 LEFT JOIN users T4 ON T4.ID = T1.p2`;
  
    // Execute the SQL query
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        res.status(500).json({ error: 'Error executing SQL query' });
        return;
      }
  
      results.forEach((row) => {
        arr.push(row);
      });
  
      res.json(arr); // Send the JSON response
    });
  };
  app.get('/notification/:id', (req, res) => {
    const data = req.params.id;
    const arr = [];
  
    const sql = `
      SELECT T1.id, T1.msg, T1.p1, T1.p2, T1.notified_to, T1.type, T2.Username, T3.Profile_image AS p1dp, T4.Profile_image AS p2dp
      FROM notification T1
      INNER JOIN users T2 ON T1.notified_to = T2.ID AND T1.notified_to = ${data}
      INNER JOIN users T3 ON T3.ID = T1.p1
      LEFT JOIN users T4 ON T4.ID = T1.p2
    `;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        res.status(500).json({ error: 'Error executing SQL query' });
        return;
      }
  
      results.forEach((row) => {
        arr.push(row);
      });
  
      res.json(arr);
    });
  });
  app.get('/posts', (req, res) => {
    const userId = req.query.uid;
    const onlyMy = req.query.only_my;
    const offset = req.query.offset || 0;
  
    let sqlQuery;
    if (onlyMy === '0') {
      sqlQuery = `
        SELECT Likes.like_bool, Likes.liked_by, createpost.filetype, createpost.post_status, createpost.id, createpost.userid,
        createpost.filename, createpost.Dsc, createpost.YTurl, users.Profile_image, users.Username
        FROM createpost
        INNER JOIN users ON createpost.userid = users.ID
        LEFT JOIN Likes ON createpost.id = Likes.postid AND Likes.liked_by = ${userId}
        ORDER BY createpost.id DESC
        LIMIT 10 OFFSET ${offset}
      `;
    } else if (onlyMy === '1') {
      sqlQuery = `
        SELECT Likes.like_bool, Likes.liked_by, createpost.filetype, createpost.id, createpost.userid,
        createpost.filename, createpost.Dsc, createpost.YTurl, users.Profile_image, users.Username
        FROM createpost
        INNER JOIN users ON createpost.userid = users.ID AND createpost.userid = ${userId}
        LEFT JOIN Likes ON createpost.id = Likes.postid AND Likes.liked_by = ${userId}
        ORDER BY createpost.id
      `;
    } else {
      return res.status(400).json({ error: 'Invalid request' });
    }
  
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ error: 'Error executing SQL query' });
      }
      res.json(results);
    });
  });
  app.post('/like', (req, res) => {
    const userId = req.body.uid;
    const postId = req.body.pid;
  
    if (!userId || !postId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    const checkQuery = `
      SELECT postid, liked_by FROM Likes WHERE postid = ${postId} AND liked_by = ${userId}
    `;
  
    db.query(checkQuery, (err, results) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ error: 'Error executing SQL query' });
      }
  
      if (results.length > 0) {
        const deleteQuery = `
          DELETE FROM Likes WHERE postid = ${postId} AND liked_by = ${userId}
        `;
        db.query(deleteQuery, (err) => {
          if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ error: 'Error executing SQL query' });
          }
          res.json({ Messages: 'Like removed', Status: true });
        });
      } else {
        const insertQuery = `
          INSERT INTO Likes (postid, like_bool, liked_by) VALUES (${postId}, 1, ${userId})
        `;
        db.query(insertQuery, (err) => {
          if (err) {
            console.error('Error executing SQL query:', err);
            return res.status(500).json({ error: 'Error executing SQL query' });
          }
          res.json({ Messages: 'Like done', Status: true });
        });
      }
    });
  });

  app.get('/followers', (req, res) => {
    const myId = req.query.myid;
    const theirId = req.query.their_id;
  
    if (!myId || !theirId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    const sqlQuery = `
      SELECT followers.kisne_kiya, users.Username, users.Profile_image AS img, users.Role, followers.kisko_kiya
      FROM users
      INNER JOIN followers ON ${myId} = followers.kisne_kiya AND followers.kisko_kiya = ${theirId}
    `;
  
    db.query(sqlQuery, (err, results) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ error: 'Error executing SQL query' });
      }
  
      if (results.length > 0) {
        res.json({ exists: true });
      } else {
        res.json({ exists: false });
      }
    });
  });
  

  app.post('/unfollow', (req, res) => {
    const userId = req.body.userid;
    const unfollowId = req.body.unfollow;
  
    if (!userId || !unfollowId) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    const sqlQuery = `
      DELETE FROM followers
      WHERE kisne_kiya = '${userId}' AND kisko_kiya = '${unfollowId}'
    `;
  
    db.query(sqlQuery, (err, result) => {
      if (err) {
        console.error('Error executing SQL query:', err);
        return res.status(500).json({ error: 'Error executing SQL query' });
      }
  
      if (result.affectedRows > 0) {
        res.json({ Messages: 'Deleted Successful', Status: 'true' });
      } else {
        res.json({ Messages: 'No records deleted', Status: 'false' });
      }
    });
  });

  app.post('/change-password', (req, res) => {
    const { user_email, password, c_password } = req.body;
  
    if (!user_email || !password || !c_password) {
      return res.status(400).json({ status: 'failed', message: 'Missing parameters.' });
    }
  
    if (password !== c_password) {
      return res.status(400).json({ status: 'failed', message: 'New password and confirm password do not match.' });
    }
  
    const newPasswordHash = md5(password);
  
    const updatePasswordQuery = `UPDATE users SET Password = '${newPasswordHash}' WHERE Email = '${user_email}'`;
  
    db.query(updatePasswordQuery, (err, result) => {
      if (err) {
        console.error('Error updating password:', err);
        return res.status(500).json({ status: 'failed', message: 'Failed to update password.' });
      }
      res.json({ status: 'success', message: 'Password updated successfully.' });
    });
  });
  app.get('/gallery', (req, res) => {
    const { profile, menubar, userid, filetype } = req.query;
    let sql = '';
  
    if (profile) {
      sql = `SELECT * FROM gallery WHERE userid = '${userid}' AND filetype = '${filetype}'`;
    } else if (menubar) {
      sql = `SELECT * FROM gallery WHERE userid = '${userid}'`;
    } else {
      return res.status(400).json({ error: 'Invalid request' });
    }
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error executing MySQL query:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  app.get('/getcount', (req, res) => {
    const { idd } = req.query;
    const status = ["pending", "approved", "shortlist", "reject"];
    const countArr = {};
    let totalCount = 0;
  
    // Status-wise count query
    status.forEach((s) => {
      const sql = `SELECT Audition_Applications.id, ...your_query_here... ORDER BY Audition_Applications.id`;
      db.query(sql, (err, results) => {
        if (err) {
          console.error('Error executing MySQL query:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        const count = results.length;
        countArr[s] = count;
        totalCount += count;
        if (Object.keys(countArr).length === status.length) {
          // Add the total count to the array
          countArr["total"] = totalCount;
          res.json(countArr);
        }
      });
    });
  });
  
  // Handle GET request for 'getcount2' endpoint
  app.get('/getcount2', (req, res) => {
    const { idd, audId } = req.query;
    const status = ["pending", "approved", "shortlist", "reject"];
    const countArr = {};
    let totalCount = 0;
  
    // Status-wise count query
    status.forEach((s) => {
      const sql = `SELECT Audition_Applications.id, ...your_query_here... ORDER BY Audition_Applications.id`;
      db.query(sql, (err, results) => {
        if (err) {
          console.error('Error executing MySQL query:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        const count = results.length;
        countArr[s] = count;
        totalCount += count;
        if (Object.keys(countArr).length === status.length) {
          // Add the total count to the array
          countArr["total"] = totalCount;
          res.json(countArr);
        }
      });
    });
  });
  app.post('/insert-chat', (req, res) => {
    const { senderid, receiverid, massage } = req.body;
  
    if (!senderid || !receiverid || !massage) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    // Insert the chat message into the database
    const sql = `INSERT INTO insert_chat_api (sender_id, to_id, message, date) 
                 VALUES (?, ?, ?, CURRENT_TIMESTAMP())`;
    db.query(sql, [senderid, receiverid, massage], (err, result) => {
      if (err) {
        console.error('Failed to insert message:', err);
        return res.status(500).json({ error: 'Failed to insert message' });
      }
      console.log('Message inserted successfully');
      res.json({ message: 'Message inserted successfully' });
    });
  });

  app.post('/insert-comment', (req, res) => {
    const { senderid, receiverid, post_id, comment } = req.body;
  
    if (!senderid || !receiverid || !post_id || !comment) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    // Insert the comment into the database
    const sql = `INSERT INTO comment (sender_id, to_id, post_id, comment, date) 
                 VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP())`;
    db.query(sql, [senderid, receiverid, post_id, comment], (err, result) => {
      if (err) {
        console.error('Failed to insert comment:', err);
        return res.status(500).json({ error: 'Failed to insert comment' });
      }
      console.log('Comment inserted successfully');
      res.json({ message: 'Comment inserted successfully' });
    });
  });
  app.post('/insert-recommendation', (req, res) => {
    const { meri_id, recomended_id, recomend_to_id } = req.body;
  
    if (!meri_id || !recomended_id || !recomend_to_id) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    // Check if the recommendation already exists
    const checkSql = `SELECT * FROM recommendation WHERE meri_id = ? AND recomended_id = ?`;
    db.query(checkSql, [meri_id, recomended_id], (err, result) => {
      if (err) {
        console.error('Error checking recommendation:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (result.length > 0) {
        return res.status(200).json({ message: 'Data already exists', status: 123 });
      }
  
      // Insert the recommendation into the database
      const insertSql = `INSERT INTO recommendation (meri_id, recomended_id, recomend_to_id) VALUES (?, ?, ?)`;
      db.query(insertSql, [meri_id, recomended_id, recomend_to_id], (err, result) => {
        if (err) {
          console.error('Error inserting recommendation:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('Recommendation inserted successfully');
        res.status(200).json({ message: 'Data inserted successfully', status: 200 });
      });
    });
  });

  app.post('/insert-casting', (req, res) => {
    const { projectid, userid, castname } = req.body;
  
    if (!projectid || !userid || !castname) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    // Check if the casting already exists
    const checkSql = `SELECT * FROM createnewcasting WHERE userid = ? AND projectid = ?`;
    db.query(checkSql, [userid, projectid], (err, result) => {
      if (err) {
        console.error('Error checking casting:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (result.length > 0) {
        return res.status(200).json({ message: 'Data already exists', status: 123 });
      }
  
      // Insert the casting into the database
      const insertSql = `INSERT INTO createnewcasting (projectid, userid, castname) VALUES (?, ?, ?)`;
      db.query(insertSql, [projectid, userid, castname], (err, result) => {
        if (err) {
          console.error('Error inserting casting:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        console.log('Casting inserted successfully');
        res.status(200).json({ message: 'Data inserted successfully', status: 200 });
      });
    });
  });

  app.get('/invite', (req, res) => {
    const myid = req.query.myid;
  
    if (!myid) {
      return res.status(400).json({ error: 'Missing required parameter "myid"' });
    }
  
    const sql = `SELECT Audition_Applications.author, Audition_Applications.applicant, Audition_Applications.auditionid, Audition_Applications.status,
                users.ID, users.Profile_image, users.Username, users.Role, users.City, Post_Audition.id, Post_Audition.Image, Post_Audition.Title, Post_Audition.Venue
                FROM Audition_Applications
                INNER JOIN users ON Audition_Applications.applicant = users.ID
                INNER JOIN Post_Audition ON Audition_Applications.auditionid = Post_Audition.id
                WHERE Audition_Applications.author = ${myid}`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.json(results);
    });
  });
  
  // API endpoint to handle 'auditionapp' request
  app.get('/auditionapp', (req, res) => {
    const idd = req.query.idd;
    const status = req.query.status;
  
    if (!idd || !status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const sql = `SELECT Audition_Applications.id, Audition_Applications.author, Audition_Applications.applicant, Audition_Applications.auditionid, Audition_Applications.status,
                Audition_Applications.M_dateandtime, Audition_Applications.E_dateandtime, Audition_Applications.meeting_link,
                users.ID, users.Profile_image, users.Username, users.Role, users.City,
                Post_Audition.Image, Post_Audition.Title, Post_Audition.Venue, Post_Audition.Registration_sd, Post_Audition.Registration_ed, Post_Audition.Audition_sd, Post_Audition.Audition_ed, Post_Audition.Description
                FROM Audition_Applications
                INNER JOIN users ON Audition_Applications.applicant = users.ID
                INNER JOIN Post_Audition ON Audition_Applications.auditionid = Post_Audition.id
                WHERE Audition_Applications.status = '${status}' AND Audition_Applications.author = ${idd}
                ORDER BY Audition_Applications.id`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.json(results);
    });
  });
  
  // API endpoint to handle 'approved' request
  app.get('/approved', (req, res) => {
    const idd = req.query.idd;
    const meeting_status = req.query.meeting_status;
  
    if (!idd || !meeting_status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const sql = `SELECT Audition_Applications.id, Audition_Applications.author, Audition_Applications.applicant, Audition_Applications.auditionid, Audition_Applications.status,
                Audition_Applications.M_dateandtime, Audition_Applications.E_dateandtime, Audition_Applications.meeting_link,
                users.ID, users.Profile_image, users.Username, users.Role, users.City,
                Post_Audition.Image, Post_Audition.Title, Post_Audition.Venue, Post_Audition.Registration_sd, Post_Audition.Registration_ed, Post_Audition.Audition_sd, Post_Audition.Audition_ed, Post_Audition.Description
                FROM Audition_Applications
                INNER JOIN users ON Audition_Applications.applicant = users.ID
                INNER JOIN Post_Audition ON Audition_Applications.auditionid = Post_Audition.id
                WHERE Audition_Applications.meeting_status = '${meeting_status}' AND Audition_Applications.applicant = ${idd}
                ORDER BY Audition_Applications.id`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.json(results);
    });
  });
  app.post('/Audition_Applications', (req, res) => {
    const { author, applicant, auditionid, status } = req.body;
  
    if (!author || !applicant || !auditionid || !status) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
  
    const sql = `SELECT * FROM Audition_Applications WHERE auditionid = ? AND applicant = ?`;
    db.query(sql, [auditionid, applicant], (err, results) => {
      if (err) {
        console.error('Error checking existing data:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (results.length > 0) {
        return res.status(409).json({
          Messages: 'Data Already Exists',
          Status: 'Conflict'
        });
      } else {
        const insertSql = `INSERT INTO Audition_Applications (author, applicant, auditionid, status) VALUES (?, ?, ?, ?)`;
        db.query(insertSql, [author, applicant, auditionid, status], (err, result) => {
          if (err) {
            console.error('Error inserting data:', err);
            return res.status(500).json({ error: 'Internal server error' });
          }
          res.json({
            Messages: 'Data Inserted Successfully',
            Status: 'Success'
          });
        });
      }
    });
  });

  app.get('/posts', (req, res) => {
    const myId = req.query.myid;
    const query = `
      SELECT post.*, followers.kisko_kiya, users.Username, users.Profile_image 
      FROM post 
      INNER JOIN followers ON post.userid = followers.kisko_kiya 
      INNER JOIN users ON followers.kisne_kiya = ? AND followers.kisko_kiya = users.ID
    `;
    db.query(query, [myId], (err, results) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  app.post('/followers', (req, res) => {
    const { kisne_kiya, kisko_kiya } = req.body;
  
    // Check if kisne_kiya and kisko_kiya are provided
    if (!kisne_kiya || !kisko_kiya) {
      return res.status(400).json({ error: 'Missing parameters' });
    }
  
    const query = `
      SELECT * FROM followers WHERE kisne_kiya = ? AND kisko_kiya = ?
    `;
    db.query(query, [kisne_kiya, kisko_kiya], (err, results) => {
      if (err) {
        console.error('Error checking existing followers:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (results.length > 0) {
        return res.status(400).json({ error: 'Data already exists' });
      }
  
      const insertQuery = `
        INSERT INTO followers (kisne_kiya, kisko_kiya) VALUES (?, ?)
      `;
      db.query(insertQuery, [kisne_kiya, kisko_kiya], (err) => {
        if (err) {
          console.error('Error inserting follower:', err);
          return res.status(500).json({ error: 'Internal server error' });
        }
        res.status(200).json({ message: 'Data insert successful' });
      });
    });
  });
  app.get('/projectlist/user/:userId', (req, res) => {
    const userId = req.params.userId;
  
    const sql = `
      SELECT * FROM my_projectlist, users 
      WHERE users.ID = ${userId} AND my_projectlist.userid = ${userId} 
      ORDER BY my_projectlist.id DESC
    `;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching project list:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  
  // API endpoint to fetch project details by project ID
  app.get('/project/:projectId', (req, res) => {
    const projectId = req.params.projectId;
  
    const sql = `
      SELECT my_projectlist.id, my_projectlist.userid, my_projectlist.title, my_projectlist.status, 
             my_projectlist.project_banner, createnewcasting.id as castid, createnewcasting.projectid, 
             createnewcasting.castname, createnewcasting.userid, users.ID, users.Username, users.Profile_image
      FROM ((my_projectlist
      INNER JOIN createnewcasting ON my_projectlist.id = createnewcasting.projectid)
      INNER JOIN users ON createnewcasting.userid = users.ID) 
      WHERE createnewcasting.projectid = ${projectId}
    `;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching project details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  
  // API endpoint to fetch projects by artist ID
  app.get('/projects/artist/:userId', (req, res) => {
    const userId = req.params.userId;
  
    const sql = `
      SELECT my_projectlist.id, my_projectlist.userid, my_projectlist.title, my_projectlist.status, 
             my_projectlist.project_banner, createnewcasting.id as castid, createnewcasting.projectid, 
             createnewcasting.castname, createnewcasting.userid, users.ID, users.Username, users.Profile_image
      FROM ((my_projectlist
      INNER JOIN createnewcasting ON my_projectlist.id = createnewcasting.projectid)
      INNER JOIN users ON createnewcasting.userid = users.ID) 
      WHERE createnewcasting.userid = ${userId}
    `;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching projects by artist ID:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  app.get('/latestproject/:userId', (req, res) => {
    const userId = req.params.userId;
  
    const sql = `SELECT * FROM my_projectlist WHERE userid = ${userId} ORDER BY id DESC LIMIT 1`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching latest project:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });
  app.get('/project/:projectId', (req, res) => {
    const projectId = req.params.projectId;
  
    const sql = `SELECT my_projectlist.id, my_projectlist.userid, my_projectlist.title, my_projectlist.status, my_projectlist.project_banner,
                        createnewcasting.id as castid, createnewcasting.projectid, createnewcasting.castname, createnewcasting.userid,
                        users.ID, users.Username, users.Profile_image
                 FROM ((my_projectlist
                 INNER JOIN createnewcasting ON my_projectlist.id = createnewcasting.projectid)
                 INNER JOIN users ON createnewcasting.userid = users.ID)
                 WHERE createnewcasting.projectid = ${projectId}
                 ORDER BY createnewcasting.id DESC
                 LIMIT 2000`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching project details:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });

  app.get('/chat', (req, res) => {
    const sender = req.query.sid;
    const receiver = req.query.rid;
  
    const sql = `SELECT * FROM insert_chat_api 
                 WHERE (sender_id = ${sender} AND to_id = ${receiver}) 
                 OR (sender_id = ${receiver} AND to_id = ${sender}) 
                 ORDER BY id ASC`;
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error fetching chat messages:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });

  app.get('/comments', (req, res) => {
    const postId = req.query.post_id;
  
    const sql = `SELECT users.Username, users.Profile_image, comment.sender_id, comment.to_id, comment.post_id, comment.comment, createpost.userid, createpost.id
                 FROM comment
                 INNER JOIN createpost ON (comment.post_id = createpost.id AND comment.post_id = ?)
                 INNER JOIN users ON comment.sender_id = users.ID`;
  
    db.query(sql, postId, (err, results) => {
      if (err) {
        console.error('Error fetching comments:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
      res.json(results);
    });
  });

  app.get('/notification', (req, res) => {
    const userId = req.query.uid;
  
    const sql = `SELECT * FROM notification WHERE notified_to = ? AND status = 0 ORDER BY id ASC LIMIT 1`;
    db.query(sql, userId, (err, results) => {
      if (err) {
        console.error('Error fetching notification:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      if (results.length > 0) {
        const notification = results[0];
        let title = '';
        switch (notification.type) {
          case 'FBO':
            title = 'New Follow';
            break;
          case 'MF':
            title = 'Favorite';
            break;
          case 'RTM':
            title = 'Recommend';
            break;
          case 'NM':
            title = 'Message';
            break;
          default:
            title = 'Notification';
        }
  
        notification.title = title;
  
        const updateSql = `UPDATE notification SET status = 1 WHERE id = ?`;
        db.query(updateSql, notification.id, (updateErr) => {
          if (updateErr) {
            console.error('Error updating notification status:', updateErr);
            return res.status(500).json({ error: 'Error updating notification status' });
          }
          res.json([notification]);
        });
      } else {
        res.json([]);
      }
    });
  });

  app.get('/recommendation', (req, res) => {
    const myId = req.query.my_id;
  
    const sql = `SELECT T1.id, T1.meri_id, T1.recomend_to_id, T1.recomended_id, 
                        T3.Username AS u1, T3.Profile_image AS p1dp, T4.Profile_image AS p2dp, T4.Username AS u2
                 FROM recommendation T1
                 INNER JOIN users T2 ON T1.recomend_to_id = T2.ID AND T1.recomended_id = ?
                 INNER JOIN users T3 ON T3.ID = T1.meri_id
                 LEFT JOIN users T4 ON T4.ID = T1.recomend_to_id`;
  
    db.query(sql, myId, (err, results) => {
      if (err) {
        console.error('Error fetching recommendations:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      const recommendations = results.map(result => ({
        id: result.id,
        meri_id: result.meri_id,
        recomend_to_id: result.recomend_to_id,
        recomended_id: result.recomended_id,
        u1: result.u1,
        p1dp: result.p1dp,
        p2dp: result.p2dp,
        u2: result.u2
      }));
  
      res.json(recommendations);
    });
  });
  app.get('/posts', (req, res) => {
    const userId = req.query.uid;
  
    const sql = `SELECT Likes.like_bool, Likes.liked_by, savedrafts.userid, savedrafts.postid, 
                        createpost.filetype, createpost.id, createpost.userid, createpost.filename,
                        createpost.Dsc, createpost.YTurl, users.Profile_image, users.Username
                 FROM (((savedrafts
                 INNER JOIN users ON savedrafts.userid = users.ID)
                 INNER JOIN createpost ON savedrafts.postid = createpost.id)
                 LEFT JOIN Likes ON createpost.id = Likes.postid AND Likes.liked_by = ?)
                 WHERE savedrafts.userid = ?`;
  
    db.query(sql, [userId, userId], (err, results) => {
      if (err) {
        console.error('Error fetching posts:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      const posts = results.map(result => ({
        like_bool: result.like_bool,
        liked_by: result.liked_by,
        userid: result.userid,
        postid: result.postid,
        filetype: result.filetype,
        id: result.id,
        filename: result.filename,
        Dsc: result.Dsc,
        YTurl: result.YTurl,
        Profile_image: result.Profile_image,
        Username: result.Username
      }));
  
      res.json(posts);
    });
  });


app.get('/users', (req, res) => {
    const { Age, Gender, Role, Register_as, City } = req.query;
  
    const sql = `SELECT * FROM users WHERE Age = ? AND Gender = ? AND Role = ? AND Register_as = ? AND City = ?`;
  
    db.query(sql, [Age, Gender, Role, Register_as, City], (err, results) => {
      if (err) {
        console.error('Error fetching users:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.json(results);
    });
  });
  
  function search(req, res) {
    const { fromAge, toAge, username, audId } = req.body;
  
    let conditions = [];
    if (fromAge && toAge) {
      conditions.push(`Age BETWEEN ${fromAge} AND ${toAge}`);
    }
    if (audId) {
      conditions.push(`auditionid = ${audId}`);
    }
    if (username) {
      conditions.push(`users.Username = '${username}'`);
    }
  
    let sql = `SELECT * FROM Audition_Applications INNER JOIN users ON Audition_Applications.applicant = users.ID`;
    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(' AND ')}`;
    }
  
    db.query(sql, (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        return res.status(500).json({ error: 'Internal server error' });
      }
  
      res.json(results);
    });
  }

  app.post('/search', search);
  const nodemailer = require('nodemailer');
  const transporter = nodemailer.createTransport({
    host: 'smtp.example.com', // Replace with your SMTP server hostname
    port: 587, // Replace with your SMTP port
    secure: false, // Change to true if your SMTP server requires SSL/TLS
    auth: {
      user: 'your_smtp_username',
      pass: 'your_smtp_password'
    }
  });
  
  // Route for sending OTP
  app.post('/send-otp', (req, res) => {
    const { emailid } = req.body;
  
    if (!emailid) {
      return res.status(400).json({ status: 'failed', message: 'Email not provided' });
    }
  
    // Generate random OTP
    const otp = Math.floor(10000 + Math.random() * 90000);
  
    // Email content
    const mailOptions = {
      from: 'your_email@example.com', // Sender email address
      to: emailid,
      subject: 'Signup OTP',
      text: `Route2Rell Signup OTP is ${otp}`
    };
  
    // Send email
    transporter.sendMail(mailOptions, (error, info) => {
      if (error) {
        console.error('Error sending email:', error);
        return res.status(500).json({ status: 'failed', message: 'Failed to send OTP email' });
      }
  
      // Insert OTP into database (replace this with your database connection and query)
      // You can use a MySQL library like mysql or mysql2 for this
      // For example:
      // connection.query('INSERT INTO otp_verifications (email, otp, verification_status) VALUES (?, ?, 0)', [emailid, otp], (err, result) => {
      //   if (err) {
      //     console.error('Error inserting OTP into database:', err);
      //     return res.status(500).json({ status: 'failed', message: 'Failed to insert OTP into database' });
      //   }
      // });
  
      // For demonstration purposes, we'll just return the OTP in the response
      res.json({ status: 'success', message: 'OTP sent successfully', otp });
    });
  });
  
  app.get('/recommendations', (req, res) => {
    const userId = req.query.myid; // Get user ID from query parameter
  
    // SQL query to retrieve recommendations
    const sql = `
      SELECT T1.id, T1.meri_id, T1.recomend_to_id, T1.recomended_id, T3.Username AS u1, T3.Profile_image AS p1dp, T4.Profile_image AS p2dp, T4.Username AS u2
      FROM recommendation T1
      INNER JOIN users T2 ON T1.recomend_to_id = T2.ID AND T1.meri_id = ?
      INNER JOIN users T3 ON T3.ID = T1.recomended_id
      LEFT JOIN users T4 ON T4.ID = T1.recomend_to_id;
    `;
  
    // Execute the SQL query
    connection.query(sql, [userId], (err, results) => {
      if (err) {
        console.error('Error executing query:', err);
        res.status(500).json({ error: 'Internal server error' });
        return;
      }
  
      // Send the results as JSON response
      res.json(results);
    });
  });

  app.post('/shortlist', (req, res) => {
    const { userid, selected_id } = req.body;
  
    if (!userid || !selected_id) {
      res.status(400).json({ message: 'userid and selected_id are required' });
      return;
    }
  
    const sql = `
      SELECT userid, selected_id FROM shortlist
      WHERE userid = ? AND selected_id = ?
    `;
  
    connection.query(sql, [userid, selected_id], (err, results) => {
      if (err) {
        console.error('Error querying database:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
  
      if (results.length > 0) {
        const deleteSql = `
          DELETE FROM shortlist WHERE userid = ? AND selected_id = ?
        `;
        connection.query(deleteSql, [userid, selected_id], (deleteErr, deleteResults) => {
          if (deleteErr) {
            console.error('Error deleting from database:', deleteErr);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          res.json({ message: 'shortlist removed', status: true });
        });
      } else {
        const insertSql = `
          INSERT INTO shortlist (userid, selected_id) VALUES (?, ?)
        `;
        connection.query(insertSql, [userid, selected_id], (insertErr, insertResults) => {
          if (insertErr) {
            console.error('Error inserting into database:', insertErr);
            res.status(500).json({ message: 'Internal server error' });
            return;
          }
          res.json({ message: 'shortlisted done', status: true });
        });
      }
    });
  });
  app.get('/shortlist/:my_id', (req, res) => {
    const data = req.params.my_id;
    
    const sql = `
      SELECT shortlist.userid, users.Username, users.Profile_image AS img, users.Role, shortlist.selected_id
      FROM users
      INNER JOIN shortlist ON users.ID = shortlist.selected_id
      WHERE shortlist.userid = ?
    `;
  
    connection.query(sql, [data], (err, results) => {
      if (err) {
        console.error('Error querying database:', err);
        res.status(500).json({ message: 'Internal server error' });
        return;
      }
  
      res.json(results);
    });
  });
  app.post('/insertTransaction', (req, res) => {
    const { userid, Transaction_amount, success_paymentid, failurecode, wallet, member_type } = req.body;
  
    // Insert data into database
    const sql = 'INSERT INTO Transactions (userid, Transaction_amount, success_paymentid, failurecode, wallet, member_type, status) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [userid, Transaction_amount, success_paymentid, failurecode, wallet, member_type, 'pending'];
    
    connection.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error inserting data into database:', err);
        res.status(500).json({ status: '403', message: 'Error occurred while inserting data' });
      } else {
        res.json({ status: '200', message: 'Data Insert is Successful' });
      }
    });
  });



  
  app.get('/projectDetails/:userid', (req, res) => {
    const uid = req.params.userid;
  
    // Query to fetch project details by userid
    const sql = `SELECT my_projectlist.id, my_projectlist.userid, my_projectlist.title, my_projectlist.status, my_projectlist.project_banner, createnewcasting.projectid, createnewcasting.castname, createnewcasting.userid, users.ID, users.Username, users.Profile_image
                FROM my_projectlist
                INNER JOIN createnewcasting ON my_projectlist.id = createnewcasting.projectid
                INNER JOIN users ON createnewcasting.userid = users.ID
                WHERE my_projectlist.id = ?`;
  
    connection.query(sql, [uid], (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        res.json(result);
      }
    });
  });
  app.get('/latestUser', (req, res) => {
    // Query to fetch the latest user
    const sql = `SELECT * FROM users ORDER BY ID DESC LIMIT 1`;
  
    connection.query(sql, (err, result) => {
      if (err) {
        console.error('Error querying database:', err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        res.json(result);
      }
    });
  });
  app.post('/savePost', (req, res) => {
    const { userid, postid } = req.body;
  
    if (userid && postid) {
      const sql = `SELECT userid, postid FROM savedrafts WHERE userid='${userid}' AND postid='${postid}'`;
  
      connection.query(sql, (err, result) => {
        if (err) {
          console.error('Error querying database:', err);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          if (result.length > 0) {
            const deleteSql = `DELETE FROM savedrafts WHERE userid='${userid}' AND postid='${postid}'`;
            connection.query(deleteSql, (err, result) => {
              if (err) {
                console.error('Error deleting post from database:', err);
                res.status(500).json({ message: 'Internal server error' });
              } else {
                res.json({ Messages: 'post removed', Status: 'true' });
              }
            });
          } else {
            const insertSql = `INSERT INTO savedrafts (userid, postid) VALUES ('${userid}', '${postid}')`;
            connection.query(insertSql, (err, result) => {
              if (err) {
                console.error('Error inserting post into database:', err);
                res.status(500).json({ message: 'Internal server error' });
              } else {
                res.json({ Messages: 'post done', Status: 'true' });
              }
            });
          }
        }
      });
    } else {
      res.status(400).json({ message: 'Bad request. Missing parameters.' });
    }
  });
  app.post('/updateUser', (req, res) => {
    const { uid, colname, value } = req.query;
  
    if (!uid || !colname || !value) {
      res.status(400).json({ message: 'Missing parameters' });
      return;
    }
  
    // Query to update user data
    const sql = `UPDATE users SET ${colname} = '${value}' WHERE id = '${uid}'`;
  
    connection.query(sql, (err, result) => {
      if (err) {
        console.error('Error updating user data:', err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        res.json({ message: 'Updated successfully', status: 'true' });
      }
    });
  });
  app.post('/updateProfile', (req, res) => {
    const { uid, Phone_Number, City, Age, Gender, Bio, Facebook, Instagram, Twitter, Youtube, Role, Register_as, Height, Weight } = req.body;
    
    const sql = `UPDATE users SET Age = ?, Gender = ?, Phone_Number = ?, Instagram = ?, Facebook = ?, Youtube = ?, Twitter = ?, City = ?, Role = ?, Register_as = ?, Height = ?, Weight = ? WHERE id = ?`;
    const values = [Age, Gender, Phone_Number, Instagram, Facebook, Youtube, Twitter, City, Role, Register_as, Height, Weight, uid];
    
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating profile:', err);
        res.status(500).json({ message: 'Error updating profile', status: 'false' });
      } else {
        console.log('Profile updated successfully');
        res.json({ message: 'Profile updated successfully', status: 'true' });
      }
    });
  });

// Update transaction status route
app.post('/updateTransactionStatus', (req, res) => {
    const { userid, status, type } = req.body;
  
    // Fetch member type from Transactions table
    const sql22 = `SELECT * FROM Transactions WHERE userid = ${userid}`;
    db.query(sql22, (err, results) => {
      if (err) {
        console.error('Error fetching transaction:', err);
        res.status(500).json({ message: 'Error fetching transaction', status: 'false' });
      } else {
        if (results.length > 0) {
          const membertype = results[0].member_type;
  
          // Update transaction status in Transactions table
          const insertSql = `UPDATE Transactions SET status = '${status}' WHERE userid = ${userid}`;
          db.query(insertSql, (err, result) => {
            if (err) {
              console.error('Error updating transaction status:', err);
              res.status(500).json({ message: 'Error updating transaction status', status: 'false' });
            } else {
              // Update user membership type and end date in users table
              const updateSql = `UPDATE users SET M_type = '${membertype}', m_enddate = DATE_ADD(NOW(), INTERVAL 1 YEAR) WHERE ID = ${userid}`;
              db.query(updateSql, (err, result) => {
                if (err) {
                  console.error('Error updating user membership type:', err);
                  res.status(500).json({ message: 'Error updating user membership type', status: 'false' });
                } else {
                  console.log('Transaction status and user membership updated successfully');
                  res.json({ message: 'Transaction status and user membership updated successfully', status: 'true' });
                }
              });
            }
          });
        } else {
          res.status(404).json({ message: 'No transaction found for the user', status: 'false' });
        }
      }
    });
  });

  app.post('/updateProject', upload.single('file'), (req, res) => {
    const { uid, title, status } = req.body;
    const project_banner = req.file ? req.file.filename : null;
  
    const sql = `UPDATE my_projectlist SET title = ?, status = ?, project_banner = ? WHERE id = ?`;
    const values = [title, status, project_banner, uid];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating project:', err);
        res.status(500).json({ message: 'Error updating project', status: 'false' });
      } else {
        console.log('Project updated successfully');
        res.json({ message: 'Project updated successfully', status: 'true' });
      }
    });
  });
  app.post('/updatePostStatus', (req, res) => {
    const { id, post_status } = req.body;
  
    const sql = `UPDATE createpost SET post_status = ? WHERE id = ?`;
    const values = [post_status, id];
  
    db.query(sql, values, (err, result) => {
      if (err) {
        console.error('Error updating post status:', err);
        res.status(500).json({ message: 'Error updating post status', status: 'false' });
      } else {
        console.log('Post status updated successfully');
        res.json({ message: 'Post status updated successfully', status: 'true' });
      }
    });
  });
  app.get('/getUserData', (req, res) => {
    const { single, following, rsendid } = req.query;
    if (single) {
      let sortlist_status = 0;
  
      const sql1 = `SELECT * FROM shortlist WHERE userid = ? AND selected_id = ?`;
      db.query(sql1, [rsendid, following], (err, result) => {
        if (err) {
          console.error('Error retrieving shortlist data:', err);
          res.status(500).json({ message: 'Internal server error' });
        } else {
          if (result.length === 1) {
            sortlist_status = 1;
          }
          const sql2 = `SELECT * FROM users WHERE ID = ?`;
          db.query(sql2, [following], (err, result) => {
            if (err) {
              console.error('Error retrieving user data:', err);
              res.status(500).json({ message: 'Internal server error' });
            } else {
              const userData = result.map(row => ({ ...row, sortlist_status }));
              res.json(userData);
            }
          });
        }
      });
    }
  });
  
  // Route to get list of all users
  app.get('/getAllUsers', (req, res) => {
    const sql = `SELECT * FROM users`;
    db.query(sql, (err, result) => {
      if (err) {
        console.error('Error retrieving user data:', err);
        res.status(500).json({ message: 'Internal server error' });
      } else {
        res.json(result);
      }
    });
  });
  app.get('/chatMessages', (req, res) => {
    const { id } = req.query;
    const sql = `
      SELECT users.ID, users.Username, users.Role, users.Profile_image, insert_chat_api.*
      FROM users
      JOIN insert_chat_api ON users.ID = insert_chat_api.to_id
      WHERE insert_chat_api.sender_id = ?
      GROUP BY insert_chat_api.to_id
      ORDER BY MAX(insert_chat_api.date) DESC
    `;
    db.query(sql, [id], (err, result) => {
      if (err) {
        console.error('Error fetching chat messages:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result);
      }
    });
  });
  app.get('/userProfiles', (req, res) => {
    const { my_id } = req.query;
    const sql = `
      SELECT t1.userid, users.Profile_image, users.Username, users.Role, t2.vieweruid
      FROM (
        SELECT *
        FROM view_profile
        WHERE vieweruid = ?
      ) t1
      LEFT OUTER JOIN (
        SELECT *
        FROM view_profile
        WHERE userid = ?
      ) t2 ON t1.userid = t2.vieweruid
      INNER JOIN users ON t1.userid = users.ID
    `;
    db.query(sql, [my_id, my_id], (err, result) => {
      if (err) {
        console.error('Error fetching user profiles:', err);
        res.status(500).json({ error: 'Internal server error' });
      } else {
        res.json(result);
      }
    });
  });
  app.post('/viewProfile', (req, res) => {
    const { userid, vieweruid } = req.body;
  
    if (userid && vieweruid) {
      const checkSql = 'SELECT * FROM view_profile WHERE userid = ? AND vieweruid = ?';
      db.query(checkSql, [userid, vieweruid], (err, result) => {
        if (err) {
          console.error('Error checking profile view:', err);
          res.status(500).json({ error: 'Internal server error' });
        } else {
          if (result.length > 0) {
            res.json({ Messages: 'Data already exists', Status: '123' });
          } else {
            const insertSql = 'INSERT INTO view_profile (userid, vieweruid) VALUES (?, ?)';
            db.query(insertSql, [userid, vieweruid], (err, result) => {
              if (err) {
                console.error('Error inserting profile view:', err);
                res.status(500).json({ error: 'Internal server error' });
              } else {
                res.json({ Messages: 'Data insert successful', Status: '200' });
              }
            });
          }
        }
      });
    } else {
      res.status(400).json({ error: 'Bad request: Missing parameters' });
    }
  });
  
  module.exports=app;