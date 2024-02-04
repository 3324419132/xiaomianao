const cloud = require('wx-server-sdk');
cloud.init();

/**
 * 校验用户登录状态的函数
 * @param {string} userId - 用户ID
 * @param {string} token - 用户登录凭证
 * @returns {boolean} - 返回用户登录状态是否有效
 */
async function validateToken(userId, token) {
  try {
    const result = await cloud.callFunction({
      name: 'tokenVerify',
      data: {
        phone: userId,
        token: token
      }
    });
    return result;
  } catch (error) {
    console.error('Token 验证失败:', error);
    return false;
  }
}

/**
 * 云函数主函数，用于获取购物车数据（不分页）
 * @param {Object} event - 云函数调用时传入的参数
 * @param {string} event.userId - 用户ID
 * @param {string} event.token - 用户登录凭证
 * @param {Object} context - 云函数调用上下文
 * @returns {Object} - 返回操作结果，包括 success（是否成功）、message（返回消息）、data（云数据库返回的数据）
 */
exports.main = async (event, context) => {
  const { userId, token } = event;

  try {
    // 校验用户登录状态
    const tokenValid = await validateToken(userId, token);
    if (!tokenValid) {
      throw new Error('Token 验证失败');
    }

    // 查询购物车数据，根据用户ID匹配
    const db = cloud.database();
    const result = await db.collection('cart')
      .where({
        userId: userId
      })
      .get();
      
    return {
      success: true,
      message: '获取购物车数据成功',
      data: result.data
    };
  } catch (error) {
    console.error('处理获取购物车数据时发生错误:', error);
    return {
      success: false,
      message: error.message
    };
  }
};
