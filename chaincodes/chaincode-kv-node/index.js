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
    const orderId = crypto.createHash('sha256').update(deliveryOrderData).digest('hex');
    orderData.status = "Submitted";
    orderData.orderId = orderId;
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", orderId };
  }

  async release(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(buffer.toString());
    orderData.status = "Released";
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK" };
  }

  async reject(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(buffer.toString());
    orderData.status = "Rejected";
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK" };
  }

  async updateRequestSL(ctx, orderId, updatedDeliveryOrderData) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(updatedDeliveryOrderData);
    orderData.status = "Processed";
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
    for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString('utf8');
      let record = JSON.parse(strValue);
      allResults.push({ Key: key, Record: record });
    }
    return allResults;
  }

  async queryAllOrdersCO(ctx, coName) {
    const startKey = '';
    const endKey = '';
    const allResults = [];
    let filterResults = []
    for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString('utf8');
      let record = JSON.parse(strValue);
      allResults.push({ Key: key, Record: record })
      filterResults = allResults.filter((data) => data.Record.requestDetail.requestorId === coName)
    }
    return filterResults
  }

  async queryAllOrdersSL(ctx, slName) {
    const startKey = '';
    const endKey = '';
    const allResults = [];
    let filterResults = [];
    for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString('utf8');
      let record = JSON.parse(strValue);
      allResults.push({ Key: key, Record: record })
      filterResults = allResults.filter((data) => data.Record.shippingLine.shippingType.split("|")[0].trim() === slName)
    }
    return filterResults
  }
}

exports.contracts = [DOContract];
