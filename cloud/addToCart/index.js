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
 * 云函数主函数，用于将数据添加至云数据库的 cart 集合中
 * @param {Object} event - 云函数调用时传入的参数
 * @param {Object} event.cartData - 待添加的购物车数据
 * @param {string} event.token - 用户登录凭证
 * @param {string} event._id - 商品ID
 * @param {Object} context - 云函数调用上下文
 * @returns {Object} - 返回操作结果，包括 success（是否成功）、message（返回消息）、data（云数据库返回的数据）
 */
exports.main = async (event, context) => {
  const { cartData, token, _id } = event;
  
  try {
    // 校验用户登录状态
    const tokenValid = await validateToken(cartData.userId, token);
    if (!tokenValid) {
      throw new Error('Token 验证失败');
    }

    // 根据商品ID查询商品信息
    const db = cloud.database();
    const goodResult = await db.collection('good').doc(_id).get();
    const goodData = goodResult.data;

    // 检查商品余量
    if (cartData.goodNum > goodData.remainingNum) {
      throw new Error('商品余量不足');
    }

    // 将数据添加至云数据库
    const cartResult = await db.collection('cart').add({
      data: cartData
    });

    return {
      success: true,
      message: '数据添加成功',
      data: cartResult
    };
  } catch (error) {
    console.error('处理添加数据时发生错误:', error);
    return {
      success: false,
      message: error.message
    };
  }
};
