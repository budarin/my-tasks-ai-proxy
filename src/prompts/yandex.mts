export function getYandexPrompt({ text, categories, priorities }: TaskDescription) {
    const dt = new Date();
    return JSON.stringify(`Сейчас: ${dt.toLocaleDateString()} ${dt.toLocaleTimeString()}
Текст задания: "${text}".

Категории задач: [${categories}]
Приоритеты: [${priorities}]

Инструкции:
1. Определи, является ли текст задачей. Задача - это действие, которое необходимо выполнить.
2. Если текст не является задачей, ответь пустым объектом {} и завершай работу.
3. Если текст является задачей, продолжай выполнение следующих шагов.

Будь внимателен и точен, ничего не выдумывай - используй только факты из текста.

Из текста выбери: 
- название задачи (до 100 символов).
- дату задачи YYYY-MM-DD. если дата указана не явно: "завтра", "в следующий понедельник", "в последнее воскресенье сентября" и т.п.- вычисли дату относительно сегодня. если дата не указана вообще - оставь ее пусой.
- время выполнения задачи HH:MM. если время указано не явно - вычисли его относительно текущего времени. если время не указано вообще - оставь его пустым.
- выбери категориюп только из списка.
- выбери приоритет.
- детали задачи (до 500 символов) не дублируй информацию из других полей.

Ответ подготовь в формате JSON без форматирования и рассуждений:
{
"title": название задачи,
"description": детали задачи,
"date": дата,
"time": время,
"category": категория,
"priority": приоритет
}

Примеры:
1. Текст задания: "Купить продукты завтра в 10:00. Хлеб -1шт, молоко - 1л."
Результат: 
{
"title": "Купить продукты",
"description": "Хлеб -1шт, молоко - 1л.",
"date": "2024-06-28",
"time": "10:00",
"category": "Дом",
"priority": "обычный"
}

2. Текст задания: "Встретить маму в 3 часа."
Результат: 
{
"title": "Встреча по работе",
"date": "2024-06-27",
"time": "15:00",
"category": "Работа",
"priority": "обычный"
}

3. Текст задания: "Завтра у меня встреча по работе."
Результат: 
{
"title": "Встреча по работе",
"date": "2024-06-28",
"category": "Работа",
"priority": "обычный"
}

4. Текст задания: "В последнее воскресенье следующего месяца"
Рассуждаем: сегодня 27.06.2024 (июнь) значит последнее воскресенье следующего месяца (июля) будет 28.07.2024
Результат: 
{
"title": "Сходить в баню",
"date": "2024-07-28",
"priority": "обычный"
}

5. Текст задания: "В среду сходить в кино"
Рассуждаем: сегодня 27.06.2024 (июнь) четверг и среда уже прошла значит следующая среда будет 04.07.2024
Результат: 
{
"title": "Сходить в кино",
"date": "2024-07-o4",
"priority": "обычный"
}

6. Текст задания: "Сегодня хорошая погода."
Текст не является задачей, поэтому результат:{}

7. Текст задания: "Как хорошо на свете жить."
Результат:{}
`);
}
