def sumar(a, b):
    return a + b

def restar(a, b):
    return a - b

def multiplicar(a, b):
    return a * b

def dividir(a, b):
    if b == 0:
        return "No se puede dividir entre cero."
    return a / b

print("Bienvenido a la calculadora básica")
print("Opciones:")
print("1. Sumar")
print("2. Restar")
print("3. Multiplicar")
print("4. Dividir")

opcion = input("Elige una opción (1/2/3/4): ")

a = float(input("Introduce el primer número: "))
b = float(input("Introduce el segundo número: "))

if opcion == '1':
    print("Resultado:", sumar(a, b))
elif opcion == '2':
    print("Resultado:", restar(a, b))
elif opcion == '3':
    print("Resultado:", multiplicar(a, b))
elif opcion == '4':
    print("Resultado:", dividir(a, b))
else:
    print("Opción inválida")
