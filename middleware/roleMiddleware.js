//ye ek function export kar raha he jo role input me leta he
module.exports = (role) => {

  return (req, res, next) => {

    if (req.user.role !== role) {

      return res.status(403).json({
        message: "Access denied"
      });

    }

    next();

  };

};
