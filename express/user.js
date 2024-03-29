const nodeMailer = require("nodemailer");
const otpGenerator = require("otp-generator");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcrypt");
const connection = require("../postgresql/config");
const jwtKey = "secret";

let transporter = nodeMailer.createTransport({
  service: "gmail",
  port: 465,
  secure: true,
  logger: true,
  debug: true,
  secureConnection: false,
  auth: {
    user: "skn.tilu@gmail.com",
    pass: "plajrafakposgczt",
  },
  tls: {
    rejectUnauthorized: true,
  },
});

const listingUser = (req, resp) => {
  connection.query("select * from users", (err, result) => {
    if (err) {
      let data = { status: 0, message: "Failed", data: result };
      resp.send(data);
    } else {
      let data = {
        status: 1,
        message: "Success",
        totalItems: result.rowCount,
        data: result.rows,
      };
      resp.send(data);
    }
  });
};

const filterUser = (req, resp) => {
  const { email, mobile, name } = req.body;

  if (email) {
    if (mobile) {
      if (name) {
        connection.query(
          "select * from users where email = $1 and mobile = $2 and name = $3",
          [email, mobile, name],
          (err, result) => {
            if (err) {
              let data = { status: 0, message: "Failed", data: result };
              resp.send(data);
            } else {
              let data = { status: 1, message: "Success", data: result.rows };
              resp.send(data);
            }
          }
        );
      } else {
        connection.query(
          "select * from users where mobile = $1",
          [mobile],
          (err, result) => {
            if (err) {
              let data = { status: 0, message: "Failed", data: result };
              resp.send(data);
            } else {
              let data = { status: 1, message: "Success", data: result.rows };
              resp.send(data);
            }
          }
        );
      }
    } else {
      connection.query(
        "select * from users where email = $1",
        [email],
        (err, result) => {
          if (err) {
            let data = { status: 0, message: "Failed", data: result };
            resp.send(data);
          } else {
            let data = { status: 1, message: "Success", data: result.rows };
            resp.send(data);
          }
        }
      );
    }
  } else if (mobile) {
    if (name) {
      connection.query(
        "select * from users where mobile = $1 and name = $2",
        [mobile, name],
        (err, result) => {
          if (err) {
            let data = { status: 0, message: "Failed", data: result };
            resp.send(data);
          } else {
            let data = { status: 1, message: "Success", data: result.rows };
            resp.send(data);
          }
        }
      );
    } else {
      connection.query(
        "select * from users where mobile = $1",
        [mobile],
        (err, result) => {
          if (err) {
            let data = { status: 0, message: "Failed", data: result };
            resp.send(data);
          } else {
            let data = { status: 1, message: "Success", data: result.rows };
            resp.send(data);
          }
        }
      );
    }
  } else if (name) {
    connection.query(
      "select * from users where name = $1",
      [name],
      (err, result) => {
        if (err) {
          let data = { status: 0, message: "Failed", data: result };
          resp.send(data);
        } else {
          let data = { status: 1, message: "Success", data: result.rows };
          resp.send(data);
        }
      }
    );
  } else {
    connection.query("select * from users", (err, result) => {
      if (err) {
        let data = { status: 0, message: "Failed", data: result };
        resp.send(data);
      } else {
        let data = { status: 1, message: "Success", data: result.rows };
        resp.send(data);
      }
    });
  }
};

const createUser = async (req, resp) => {
  const { email, mobile, name, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hassedPassword = await bcrypt.hash(password, salt);

  connection.query(
    "select * from users where email = $1 or mobile = $2",
    [email, mobile],
    (err, result) => {
      if (result.rowCount != 0) {
        connection.query(
          "select * from users where email = $1",
          [email],
          (err, result) => {
            if (result.rowCount != 0) {
              connection.query(
                "select * from users where mobile = $1",
                [mobile],
                (err, result) => {
                  if (result.rowCount != 0) {
                    let data = {
                      status: 0,
                      message: "Email & Mobile Already Exist",
                    };
                    resp.send(data);
                  } else {
                    let data = { status: 0, message: "Email Already Exist" };
                    resp.send(data);
                  }
                }
              );
            } else {
              let data = { status: 0, message: "Mobile Already Exist" };
              resp.send(data);
            }
          }
        );
      } else {
        connection.query(
          "insert into users (email, mobile, name, password) values ($1, $2, $3, $4) returning *",
          [email, mobile, name, hassedPassword],
          (err, result) => {
            let data = {
              status: 1,
              message: "User Created Successfully",
              data: result.rows[0],
            };
            resp.send(data);
          }
        );
      }
    }
  );
};

const loginUser = async (req, resp) => {
  const { email, password } = req.body;

  connection.query(
    "select * from users where email = $1",
    [email],
    (err, result) => {
      if (result.rowCount != 0) {
        const userDetails = result.rows[0];
        const userPassword = userDetails.password;
        bcrypt.compare(password, userPassword, (err, result) => {
          if (result) {
            jwt.sign(userDetails, jwtKey, (err, result) => {
              if (err) {
                let data = {
                  status: 0,
                  message: "User not found",
                };
                resp.send(data);
              } else {
                let data = {
                  status: 1,
                  message: "Login Successfully",
                  data: userDetails,
                  token: result,
                };
                resp.send(data);
              }
            });
          } else {
            let data = {
              status: 0,
              message: "Wrong Password",
            };
            resp.send(data);
          }
        });
      } else {
        let data = {
          status: 0,
          message: "Wrong Email",
        };
        resp.send(data);
      }
    }
  );
};

const changePassword = async (req, resp) => {
  const token = req.body["token"];
  const decodeToken = jwt.decode(token, jwtKey);
  const id = parseInt(decodeToken.id);
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hassedPassword = await bcrypt.hash(confirmPassword, salt);

  connection.query("select * from users where id = $1", [id], (err, result) => {
    const userPassword = result.rows[0].password;
    bcrypt.compare(currentPassword, userPassword, (err, result) => {
      if (result) {
        if (newPassword == confirmPassword) {
          connection.query(
            "update users set password = $1 where id = $2",
            [hassedPassword, id],
            (err, result) => {
              let data = {
                status: 1,
                message: "Password Changed Successfully",
              };
              resp.send(data);
            }
          );
        } else {
          let data = { status: 0, message: "Password does not match" };
          resp.send(data);
        }
      } else {
        let data = { status: 0, message: "Enter Wrong Password" };
        resp.send(data);
      }
    });
  });
};

const sendOtp = async (req, resp) => {
  const otp = generateOTP();
  const { email } = req.body;
  var mailOption = {
    from: "skn.tilu@gmail.com",
    to: email,
    subject: "OTP",
    text: `User verification OTP: ${otp}`,
  };
  connection.query(
    "select * from users where email = $1",
    [email],
    (err, result) => {
      if (result.rowCount != 0) {
        transporter.sendMail(mailOption, (err, info) => {
          if (err) {
            console.log(err);
          } else {
            let data = {
              status: 1,
              message: "OTP Send Successfully",
              otp: otp,
            };
            connection.query("update users set otp = $1 where email = $2", [
              otp,
              email,
            ]);
            resp.send(data);
          }
        });
      } else {
        let data = { status: 0, message: "User does not exist" };
        resp.send(data);
      }
    }
  );
};

const verifyOtp = async (req, resp) => {
  const { email, otp } = req.body;

  connection.query(
    "select * from users where email = $1 and otp = $2",
    [email, otp],
    (err, result) => {
      if (result.rowCount != 0) {
        let data = {
          status: 1,
          message: "OTP verified Successfully",
        };
        resp.send(data);
      } else {
        let data = { status: 0, message: "OTP does not match" };
        resp.send(data);
      }
    }
  );
};

const resetPassword = async (req, resp) => {
  const { email, newPassword, confirmPassword } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hassedPassword = await bcrypt.hash(confirmPassword, salt);

  if (newPassword == confirmPassword) {
    connection.query(
      "update users set password = $1 where email = $2",
      [hassedPassword, email],
      (err, result) => {
        let data = { status: 1, message: "Reset Password Successfully" };
        resp.send(data);
      }
    );
  } else {
    let data = { status: 0, message: "Password does not match" };
    resp.send(data);
  }
};

const updateUser = async (req, resp) => {
  const token = req.body["token"];
  const decodeToken = jwt.decode(token, jwtKey);
  const id = parseInt(decodeToken.id);
  const { email, mobile, name, password } = req.body;
  const salt = await bcrypt.genSalt(10);
  const hassedPassword = await bcrypt.hash(password, salt);

  connection.query(
    "update users set email = $1, mobile = $2, name = $3, password = $4 where id = $5",
    [email, mobile, name, hassedPassword, id],
    (err, result) => {
      let data = {
        status: 1,
        message: "User Updated Successfully",
      };
      resp.send(data);
    }
  );
};

const deleteUser = (req, resp) => {
  const token = req.body["token"];
  const decodeToken = jwt.decode(token, jwtKey);
  const id = parseInt(decodeToken.id);

  connection.query("delete from users where id = $1", [id], (err, result) => {
    let data = {
      status: 1,
      message: "User Deleted Successfully",
    };
    resp.send(data);
  });
};

function verifyToken(req, resp, next) {
  const token = req.body["token"];
  if (token) {
    jwt.verify(token, jwtKey, (err, valid) => {
      if (err) {
        let data = {
          status: 0,
          message: "Please provide valid token",
        };
        resp.status(401).send(data);
      } else {
        next();
      }
    });
  } else {
    let data = {
      status: 0,
      message: "Please add token",
    };
    resp.status(403).send(data);
  }
}

function generateOTP() {
  const otp = otpGenerator.generate(6, {
    upperCaseAlphabets: false,
    lowerCaseAlphabets: false,
    specialChars: false,
  });
  return otp;
}

module.exports = {
  loginUser,
  listingUser,
  filterUser,
  createUser,
  deleteUser,
  updateUser,
  changePassword,
  resetPassword,
  sendOtp,
  verifyOtp,
  verifyToken,
  generateOTP,
};
