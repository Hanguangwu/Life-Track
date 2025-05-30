/**
 * Cloudflare R2 对象存储服务
 */
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3'
import { getSignedUrl } from '@aws-sdk/s3-request-presigner'

/**
 * Cloudflare R2 配置
 */
const R2_CONFIG = {
  endpoint: import.meta.env.VITE_CF_ENDPOINT || '',
  accessKeyId: import.meta.env.VITE_CF_ACCESSKEY_ID || '',
  secretAccessKey: import.meta.env.VITE_CF_ACCESSKEY_SECRET || '',
  bucket: import.meta.env.VITE_CF_BUCKET_NAME,
  publicUrl: import.meta.env.VITE_CF_PUBLIC_URL,
  accountId: import.meta.env.VITE_CF_ACCOUNT_ID,
  region: 'auto'
}

// 打印环境变量，用于调试
// console.log('环境变量:', {
//   CF_ENDPOINT: import.meta.env.VITE_CF_ENDPOINT,
//   CF_ACCESSKEY_ID: import.meta.env.VITE_CF_ACCESSKEY_ID,
//   CF_ACCESSKEY_SECRET: import.meta.env.VITE_CF_ACCESSKEY_SECRET ? '已设置' : '未设置',
//   CF_BUCKET_NAME: import.meta.env.VITE_CF_BUCKET_NAME,
//   CF_PUBLIC_URL: import.meta.env.VITE_CF_PUBLIC_URL,
//   CF_ACCOUNT_ID: import.meta.env.VITE_CF_ACCOUNT_ID
// })

/**
 * S3客户端实例
 */
const s3Client = new S3Client({
  region: R2_CONFIG.region,
  endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: R2_CONFIG.accessKeyId,
    secretAccessKey: R2_CONFIG.secretAccessKey,
  },
})

// console.log('S3Client配置:', {
//   region: R2_CONFIG.region,
//   endpoint: `https://${R2_CONFIG.accountId}.r2.cloudflarestorage.com`,
//   bucket: R2_CONFIG.bucket,
//   publicUrl: R2_CONFIG.publicUrl,
//   accessKeyId: R2_CONFIG.accessKeyId ? '已设置' : '未设置',
//   secretAccessKey: R2_CONFIG.secretAccessKey ? '已设置' : '未设置',
// })

/**
 * Cloudflare R2 服务类
 */
export class CloudflareR2Service {
  /**
   * 上传图片到R2存储
   * @param file 图片文件
   * @param timestamp 时间戳，用于生成唯一文件名
   * @returns 图片URL和时间戳
   */
  static async uploadImage(file: File, timestamp: string): Promise<{ url: string; timestamp: string }> {
    try {
      // 生成文件扩展名
      const fileExtension = file.name.split('.').pop() || 'jpg'
      // 生成文件路径：life-track/timestamp.extension
      const key = `life-track/${timestamp}.${fileExtension}`
      // console.log('上传路径:', key)
      // console.log('Bucket名称:', R2_CONFIG.bucket)
      
      // 创建上传命令
      const command = new PutObjectCommand({
        Bucket: R2_CONFIG.bucket,
        Key: key,
        ContentType: file.type,
      })
      
      // 生成预签名URL
      const presignedUrl = await getSignedUrl(s3Client, command, {
        expiresIn: 60 * 5, // 5分钟过期
      })
      
      // console.log('预签名URL:', presignedUrl)
      
      // 使用预签名URL上传文件
      const uploadResponse = await fetch(presignedUrl, {
        method: 'PUT',
        body: file,
        headers: {
          'Content-Type': file.type,
        },
      })
      
      if (!uploadResponse.ok) {
        throw new Error(`上传失败: ${uploadResponse.status} ${uploadResponse.statusText}`)
      }
      
      // console.log('上传成功，状态码:', uploadResponse.status)
      
      // 生成访问URL
      const url = `https://${R2_CONFIG.publicUrl}/${key}`
      // console.log('生成的访问URL:', url)
      // console.log('公共访问URL:', R2_CONFIG.publicUrl)
      
      return { url, timestamp }
    } catch (error) {
      console.error('上传图片失败:', error)
      throw new Error(`上传图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  /**
   * 批量上传图片
   * @param files 图片文件数组
   * @returns 图片URL和时间戳数组
   */
  static async uploadImages(files: File[]): Promise<{ urls: string[]; timestamps: string[] }> {
    const urls: string[] = []
    const timestamps: string[] = []
    
    for (const file of files) {
      const timestamp = Date.now().toString() + Math.random().toString(36).substr(2, 9)
      const result = await this.uploadImage(file, timestamp)
      urls.push(result.url)
      timestamps.push(result.timestamp)
    }
    
    return { urls, timestamps }
  }
  
  /**
   * 删除R2存储中的图片
   * @param timestamp 图片时间戳
   */
  static async deleteImage(timestamp: string): Promise<void> {
    try {
      //console.log('删除图片:', timestamp)
      // 尝试删除常见的图片格式
      const extensions = ['jpg', 'jpeg', 'png', 'gif', 'webp']
      
      for (const ext of extensions) {
        try {
          const key = `life-track/${timestamp}.${ext}`
          const command = new DeleteObjectCommand({
            Bucket: R2_CONFIG.bucket,
            Key: key,
          })
          //console.log('删除Bucket:', R2_CONFIG.bucket, '路径:', key)
          
          await s3Client.send(command)
          //console.log(`成功删除图片: ${key}`)
          break // 删除成功后跳出循环
        } catch (error) {
          // 如果文件不存在，继续尝试下一个扩展名
          continue
        }
      }
    } catch (error) {
      console.error('删除图片失败:', error)
      throw new Error(`删除图片失败: ${error instanceof Error ? error.message : '未知错误'}`)
    }
  }
  
  /**
   * 批量删除图片
   * @param timestamps 图片时间戳数组
   */
  static async deleteImages(timestamps: string[]): Promise<void> {
    for (const timestamp of timestamps) {
      await this.deleteImage(timestamp)
    }
  }
}