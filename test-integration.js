#!/usr/bin/env node

/**
 * 测试 cPilot_v1 集成
 * 运行: node test-integration.js
 */

const fetch = require('node-fetch');

const CPILOT_API_URL = process.env.CPILOT_API_URL || 'http://localhost:7860';

async function testCpilotIntegration() {
  console.log('🧪 测试 cPilot_v1 集成...\n');

  try {
    // 测试 1: 检查服务是否运行
    console.log('1️⃣ 检查服务状态...');
    const healthResponse = await fetch(`${CPILOT_API_URL}/`);
    if (healthResponse.ok) {
      console.log('✅ 服务正在运行');
    } else {
      console.log('❌ 服务响应异常:', healthResponse.status);
    }

    // 测试 2: 获取可用模块
    console.log('\n2️⃣ 获取可用模块...');
    try {
      const modulesResponse = await fetch(`${CPILOT_API_URL}/api/modules`);
      if (modulesResponse.ok) {
        const modules = await modulesResponse.json();
        console.log('✅ 可用模块:', modules.modules || []);
      } else {
        console.log('❌ 获取模块失败:', modulesResponse.status);
      }
    } catch (error) {
      console.log('❌ 获取模块出错:', error.message);
    }

    // 测试 3: 发送测试消息
    console.log('\n3️⃣ 发送测试消息...');
    try {
      const testMessage = {
        question: '你好，请介绍一下你自己',
        module_name: 'run_qwen_zh'
      };

      const chatResponse = await fetch(`${CPILOT_API_URL}/api/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testMessage),
      });

      if (chatResponse.ok) {
        const result = await chatResponse.json();
        console.log('✅ 消息发送成功');
        console.log('📝 回复:', result.answer?.substring(0, 100) + '...');
        console.log('🔢 Token 信息:', result.token_info);
        console.log('📊 状态:', result.status);
      } else {
        console.log('❌ 发送消息失败:', chatResponse.status);
        const errorText = await chatResponse.text();
        console.log('错误详情:', errorText);
      }
    } catch (error) {
      console.log('❌ 发送消息出错:', error.message);
    }

  } catch (error) {
    console.log('❌ 测试失败:', error.message);
  }

  console.log('\n🏁 测试完成');
}

// 运行测试
if (require.main === module) {
  testCpilotIntegration().catch(console.error);
}

module.exports = { testCpilotIntegration }; 