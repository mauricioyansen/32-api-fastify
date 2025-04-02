import { beforeAll, afterAll, describe, it, expect, beforeEach } from "vitest";
import supertest from "supertest";
import { app } from "../src/app";
import { execSync } from "child_process";

describe("Transactions routes", () => {
  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
  });

  beforeEach(() => {
    execSync("npm run knex migrate:rollback --all");
    execSync("npm run knex migrate:latest");
  });

  it("should be able to create a new transaction", async () => {
    await supertest(app.server)
      .post("/transactions")
      .send({
        title: "Test transaction",
        amount: 5000,
        type: "credit",
      })
      .expect(201);
  });

  it("should be able to list all transactions", async () => {
    const createTransactionRes = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "Test transaction to get all transactions",
        amount: 4000,
        type: "credit",
      });

    const cookies = createTransactionRes.get("Set-Cookie")!;

    const listTransactionsRes = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    expect(listTransactionsRes.body.transactions).toEqual([
      expect.objectContaining({
        title: "Test transaction to get all transactions",
        amount: 4000,
      }),
    ]);
  });

  it("should be able to get a transaction by id", async () => {
    const createTransactionRes = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "Test transaction to get transaction by id",
        amount: 4000,
        type: "credit",
      });

    const cookies = createTransactionRes.get("Set-Cookie")!;

    const listTransactionsRes = await supertest(app.server)
      .get("/transactions")
      .set("Cookie", cookies)
      .expect(200);

    const transactionId = listTransactionsRes.body.transactions[0].id;

    const getTransactionByIdRes = await supertest(app.server)
      .get(`/transactions/${transactionId}`)
      .set("Cookie", cookies)
      .expect(200);

    expect(getTransactionByIdRes.body.transaction).toEqual(
      expect.objectContaining({
        title: "Test transaction to get transaction by id",
        amount: 4000,
      })
    );
  });

  it("should be able to get the summary", async () => {
    const createTransactionRes = await supertest(app.server)
      .post("/transactions")
      .send({
        title: "Test transaction to get summary",
        amount: 4000,
        type: "credit",
      });

    const cookies = createTransactionRes.get("Set-Cookie")!;

    await supertest(app.server)
      .post("/transactions")
      .set("Cookie", cookies)
      .send({
        title: "Test transaction to get summary 2",
        amount: 1000,
        type: "debit",
      });

    const summaryRes = await supertest(app.server)
      .get("/transactions/summary")
      .set("Cookie", cookies)
      .expect(200);

    expect(summaryRes.body.summary).toEqual({ amount: 3000 });
  });
});
