export type EarnableRoom = {
  points: number;
  quiz: { id: string } | null;
  tasks: { points: number }[];
};

/**
 * Poin yang benar-benar bisa diraih di sebuah room: poin setiap task, ditambah poin room sebagai bonus
 * quiz bila room punya quiz (poin room hanya diberikan saat quiz lulus, lihat quiz-service).
 */
export function earnablePoints(room: EarnableRoom) {
  const taskPoints = room.tasks.reduce((sum, task) => sum + Math.max(task.points, 0), 0);
  const quizBonus = room.quiz ? Math.max(room.points, 0) : 0;
  return { total: taskPoints + quizBonus, taskPoints, quizBonus };
}
