const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class DOContract extends Contract {
  constructor() {
    super("DOContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  async request(ctx, deliveryOrderData) {
    const orderData = JSON.parse(deliveryOrderData);
    orderData.status = "requested";
    const orderId = crypto.createHash('sha256').update(deliveryOrderData).digest('hex');
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", orderId };
  }

  async release(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(buffer.toString());
    orderData.status = "released";
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK" };
  }

  async reject(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(buffer.toString());
    orderData.status = "rejected";
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK" };
  }

  async updateRequest(ctx, orderId, updatedDeliveryOrderData) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(updatedDeliveryOrderData);
    orderData.status = "requested";
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK" };
  }

  async queryOrderById(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    return JSON.parse(buffer.toString());
  }

  async queryAllOrders(ctx) {
    const startKey = '';
    const endKey = '';
    const allResults = [];
    for await (const {key, value} of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString('utf8');
      let record = JSON.parse(strValue);
      allResults.push({ Key: key, Record: record });
    }
    return allResults;
  }
}

exports.contracts = [DOContract];
