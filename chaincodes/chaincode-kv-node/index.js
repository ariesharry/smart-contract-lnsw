const { Contract } = require("fabric-contract-api");
const crypto = require("crypto");

class DOContract extends Contract {
  constructor() {
    super("DOContract");
  }

  async instantiate() {
    // function that will be invoked on chaincode instantiation
  }

  async requestDO(ctx, deliveryOrderData) {
    const orderData = JSON.parse(deliveryOrderData);
    const orderId = crypto.createHash('sha256').update(deliveryOrderData).digest('hex');
    orderData.statusDate = new Date().toLocaleString();
    orderData.status = "Submitted";
    orderData.orderId = orderId;
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", orderId: orderId, status: orderData.status, datetime: orderData.statusDate };
  }

  async getStatusDO(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) {
      return { error: "NOT_FOUND" }
    }
    const orderData = JSON.parse(buffer.toString())
    return { success: "OK", status: orderData.status, datetime: orderData.statusDate }
  }

  async updateStatusDO(ctx, orderId, status) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) {
      return { error: "NOT_FOUND" }
    }
    const orderData = JSON.parse(buffer.toString())
    // console.log(orderData) // jadi format json
    orderData.status = status;
    orderData.statusDate = new Date().toLocaleString();
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", status: orderData.status, datetime: orderData.statusDate }
  }

  async updateDO(ctx, orderId, updatedDeliveryOrderData) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(updatedDeliveryOrderData);
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", status: orderData.status, datetime: orderData.statusDate };
  }

  async releaseDO(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(buffer.toString());
    orderData.status = "Released";
    orderData.statusDate = new Date().toLocaleString()
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", status: orderData.status, datetime: orderData.statusDate };
  }

  async rejectDO(ctx, orderId) {
    const buffer = await ctx.stub.getState(orderId);
    if (!buffer || !buffer.length) return { error: "NOT_FOUND" };
    const orderData = JSON.parse(buffer.toString());
    orderData.status = "Rejected";
    orderData.statusDate = new Date().toLocaleDateString();
    await ctx.stub.putState(orderId, Buffer.from(JSON.stringify(orderData)));
    return { success: "OK", status: orderData.status, datetime: orderData.statusDate };
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
      filterResults = allResults.filter((data) => data.Record.requestDetail.requestor.requestorId === coName)
    }
    return filterResults
  }

  async queryAllOrdersSL(ctx, listKodeSL) {
    const startKey = '';
    const endKey = '';
    const allResults = [];
    let filterResults = [];
    const listSLCode = JSON.parse(listKodeSL)
    for await (const { key, value } of ctx.stub.getStateByRange(startKey, endKey)) {
      const strValue = Buffer.from(value).toString('utf8');
      let record = JSON.parse(strValue);
      allResults.push({ Key: key, Record: record })
      filterResults = allResults.filter((data) => listSLCode.includes(data.Record.requestDetail.shippingLine.shippingType.split("|")[0].trim()))
    }
    return filterResults
  }
}

exports.contracts = [DOContract];
