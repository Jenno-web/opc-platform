// 短信验证码发送的抽象接口，和 AIProvider 是同一个设计思路：
// 业务逻辑（生成验证码、校验、签发 token）只认这个接口，不关心背后是真发短信还是开发态打日志。
//
// 接入真实短信服务商（阿里云/腾讯云）时，新建一个实现了这个接口的 Provider，
// 在 AuthModule 里挂上去即可，不需要改 AuthService 一行代码。
export interface SmsProvider {
  sendVerificationCode(phone: string, code: string): Promise<void>;
}
