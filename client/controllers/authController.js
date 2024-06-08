const axios = require('axios');

const updateAccessToken = async (req, res, next) => {
  try {
    // Lấy refreshToken từ cookie
    const refreshToken = req.cookies.refreshToken;

    if (!refreshToken) {
      // Không có refreshToken, redirect về trang đăng nhập
      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.redirect('/login');
    }

    // Gửi yêu cầu refresh token đến server
    const response = await axios.post('http://localhost:8000/auth/refresh', {}, {
      headers: {
        Cookie: `refreshToken=${refreshToken}`
      }
    });
    const { accessToken, refreshToken: newRefreshToken } = response.data;

    // Lưu token mới vào cookie
    res.cookie('accessToken', accessToken);
    res.cookie('refreshToken', newRefreshToken);

    // Tiếp tục các middleware khác
    next();
  } catch (error) {
    // Lỗi xảy ra khi refresh token, redirect về trang đăng nhập
    console.error('Error updating access token:', error);
    res.clearCookie('accessToken');
    res.clearCookie('refreshToken');
    return res.redirect('/CannotRequestToServer');
  }
};

module.exports = {
  updateAccessToken
};