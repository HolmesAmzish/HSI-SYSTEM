import pika
import json
import os
from config import RABBITMQ_HOST, TASK_QUEUE, RESULT_QUEUE, OUTPUT_DIR
from mat_service import MatService


def on_request(ch, method, props, body):
    """消息回调处理函数"""
    try:
        # 1. 解析任务指令 (来自 Java)
        # 预期格式: {"taskId": "123", "filePath": "C:/.../test.mat"}
        task = json.loads(body)
        task_id = task.get("taskId")
        mat_path = task.get("filePath")

        print(f" [INFO] 开始处理任务: {task_id}")

        # 2. 准备输出路径
        bin_filename = f"{task_id}.bin"
        bin_path = OUTPUT_DIR / bin_filename

        # 3. 调用 Service 执行转换
        metadata = MatService.process_mat(mat_path, bin_path)

        # 4. 构建结果消息回传给 Java
        result = {
            "taskId": task_id,
            "status": "COMPLETED",
            "binPath": str(bin_path).replace("\\", "/"),
            "height": metadata["height"],
            "width": metadata["width"],
            "bands": metadata["bands"]
        }

        # 5. 发送回结果队列
        ch.basic_publish(
            exchange='',
            routing_key=RESULT_QUEUE,
            body=json.dumps(result)
        )
        print(f" [SUCCESS] 任务 {task_id} 完成，已回传结果。")

    except Exception as e:
        print(f" [ERROR] 处理失败: {str(e)}")
        # 错误回传逻辑可在此补充

    finally:
        # 确认消息已被处理
        ch.basic_ack(delivery_tag=method.delivery_tag)


def main():
    # 建立连接
    connection = pika.BlockingConnection(pika.ConnectionParameters(host=RABBITMQ_HOST))
    channel = connection.channel()

    # 声明队列
    channel.queue_declare(queue=TASK_QUEUE, durable=True)
    channel.queue_declare(queue=RESULT_QUEUE, durable=True)

    # 公平分发：一次只给一个任务，处理完再给下一个
    channel.basic_qos(prefetch_count=1)
    channel.basic_consume(queue=TASK_QUEUE, on_message_callback=on_request)

    print(f" [*] HSI Worker 已启动，监听队列: {TASK_QUEUE}")
    channel.start_consuming()


if __name__ == '__main__':
    main()