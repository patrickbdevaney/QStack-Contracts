import algosdk from "algosdk";
import * as bkr from "beaker-ts";
export class  extends bkr.ApplicationClient {
    desc: string = "";
    override appSchema: bkr.Schema = { declared: {}, reserved: {} };
    override acctSchema: bkr.Schema = { declared: {}, reserved: {} };
    override approvalProgram: string = "I3ByYWdtYSB2ZXJzaW9uIDkKCnR4biBBcHBsaWNhdGlvbklECmludCAwCj4KaW50IDYKKgp0eG4gT25Db21wbGV0aW9uCisKc3dpdGNoIGNyZWF0ZV9Ob09wIE5PVF9JTVBMRU1FTlRFRCBOT1RfSU1QTEVNRU5URUQgTk9UX0lNUExFTUVOVEVEIE5PVF9JTVBMRU1FTlRFRCBOT1RfSU1QTEVNRU5URUQgY2FsbF9Ob09wCgpOT1RfSU1QTEVNRU5URUQ6CgllcnIKCmFiaV9yb3V0ZV9kZWZhdWx0VEVBTFNjcmlwdENyZWF0ZToKCWludCAxCglyZXR1cm4KCmNyZWF0ZV9Ob09wOgoJdHhuIE51bUFwcEFyZ3MKCWJ6IGFiaV9yb3V0ZV9kZWZhdWx0VEVBTFNjcmlwdENyZWF0ZQoJZXJyCgpjYWxsX05vT3A6CgllcnI=";
    override clearProgram: string = "I3ByYWdtYSB2ZXJzaW9uIDkKaW50IDE=";
    override methods: algosdk.ABIMethod[] = [];
    compose = {};
}
