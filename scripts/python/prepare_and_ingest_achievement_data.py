import json
import re
import os

'''
@TODO
write implimentation to fetch fresh data from some api and then perform ETL.
'''

# raw rawData to be fetch and saved as json
RAW_ACHIEVEMNET_DATA = '../../test/test.json'

def convert_roman_to_int(text):
  """Converts a string containing roman numerals to an integer.

  Args:
      text: The string containing roman numerals.

  Returns:
      The integer equivalent of the roman numerals.
  """
  roman_numeral_map = {
      'I': 1,
      'V': 5,
      'X': 10,
      'L': 50,
      'C': 100,
      'D': 500,
      'M': 1000,
  }
  result = 0
  for i in range(len(text)):
    value = roman_numeral_map.get(text[i])
    if value is not None:
      if i + 1 < len(text) and value < roman_numeral_map.get(text[i + 1], 0):
        result -= value
      else:
        result += value
  return result

def replace_roman_with_int(text):
  pattern = r"\b[IVXLCDM]+\b"  # Word boundaries for isolated Roman numerals
  def replace(match):
    return f"{convert_roman_to_int(match.group(0))}"
  return re.sub(pattern, replace, text)

def toPascal(inputString):
    inputString = replace_roman_with_int(inputString)
    pascalCase = inputString.translate(str.maketrans('', '', "\"'?!.,:")).title().replace(" ", "")
    return pascalCase

def generate_typescript_code(cleanJsonData):

    achievementCatKey = ''
    achievementCatName = ''
    achievementKey = ''
    achievementName = ''

    achievementCategoryCode = "export type AchievementCategoryKey ="
    achievementsCode = "export type AchievementKey ="
    for key in cleanJsonData.keys():
        # Achievemnt Category Keys
        achievementCatKey = key
        achievementCatName = cleanJsonData[key]['name']
        achievementCategoryCode = achievementCategoryCode + f'''\n  | '{achievementCatKey}' // {achievementCatName}'''

        # Achievemnt Keys
        achievements = cleanJsonData[key]['achievements']
        for achievement in achievements:
            achievementKey = achievement['key']
            achievementName = achievement['name']
            achievementsCode = achievementsCode + f'''\n  | '{achievementKey}' // {achievementName}'''
    
    achievementCategoryCode = achievementCategoryCode + f'''\n  ;'''
    achievementsCode = achievementsCode + f'''\n  ;'''
    return achievementCategoryCode, achievementsCode

'''
structure of the rawData to be ingested
{
    "CaterogyKey": {
        "name": "Caterogy Name",
        "achievements": [
            {
                "key": "AcheivementKey",
                "name": "Acheivement Name"
            },
            {
                "key": "AcheivementKey",
                "name": "Acheivement Name"
            }
        ]
    }
}

'''

# read raw data
rawData = []
with open(RAW_ACHIEVEMNET_DATA, encoding='utf-8') as rawAchievemnets:
    rawData = json.load(rawAchievemnets)

cleanJsonData = {}

# clean and re-structure data
for key in rawData.keys():
    achievements = []
    achievementsInCategory = rawData[key]['achievements']
    
    for achievementKey in achievementsInCategory:
        if isinstance(achievementKey, list):
            achievements.append({
                "key": toPascal(achievementKey[0]['name'])+"1",
                "name": achievementKey[0]['name']+" 1"
            })
            achievements.append({
                "key": toPascal(achievementKey[0]['name'])+"2",
                "name": achievementKey[0]['name']+" 2"
            })
            achievements.append({
                "key": toPascal(achievementKey[0]['name'])+"3",
                "name": achievementKey[0]['name']+" 3"
            })
        else:
            achievements.append({
                "key": toPascal(achievementKey['name']),
                "name": achievementKey['name']
            })

    pascalCaseKey = toPascal(rawData[key]['name'])
    cleanJsonData[pascalCaseKey] = {
        "name": rawData[key]['name'],
        "achievements": achievements
    }

# write to files
with open("../../types/GOOD/AchievementCategoryKey.ts", "w+t", encoding='utf-8') as achievementCategoryKey, open("../../types/GOOD/AchievementKey.ts", "w+t", encoding='utf-8') as achievementKey:
    achievementCategoryCode, achievementsCode = generate_typescript_code(cleanJsonData)
    
    achievementCategoryKey.write(achievementCategoryCode)
    achievementKey.write(achievementsCode)

    achievementCategoryKey.close()
    achievementKey.close()

